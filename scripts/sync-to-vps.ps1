# Локальная PostgreSQL или готовый дамп из scripts/ГГГГ-ММ-ДД и uploads → VPS.
# Запуск: .\scripts\sync-to-vps.ps1
# Требуется: ssh/scp. pg_dump нужен только если выбран дамп с локальной базы.
#
# Перед заливкой на VPS снимается страховочный дамп в $RemoteProject/backups/.
# База на сервере пересоздаётся. Каталог uploads в контейнере заменяется локальным.
# --- Настройки ---
$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) { $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path }
$DateFolder = Get-Date -Format "yyyy-MM-dd"
# SSH: пользователь и IP текущего VPS
$RemoteUser = "deploy"
$RemoteHost = "168.113.157.134"
$RemoteProject = "/home/deploy/catshredias-blog"
$RemoteDbContainer = "catshredia-blog-db"
$RemoteWebContainer = "catshredia-blog-web"
$RemoteUploadsPath = "/app/uploads"
$LocalProjectRoot = Split-Path $ScriptDir -Parent
$LocalDumpDir = Join-Path $ScriptDir "$DateFolder\local"
$LocalUploadsDir = Join-Path $LocalProjectRoot "uploads"
$LocalPgHost = "localhost"
$LocalPgPort = 55433
$LocalPgUser = "postgres"
$LocalPgPassword = "postgres"
$LocalPgDatabase = "portfolio_db"
$UseSshAgent = $true
$SshPrivateKeyPath = "$env:USERPROFILE\.ssh\id_ed25519"
# $true — перед заливкой снять дамп базы, которая сейчас на VPS
$RunRemoteBackupFirst = $true
$ConfirmBeforeRemoteDbReset = $true
$ConfirmBeforeRemoteUploadsReset = $true
# --- Скрипт ---
$ErrorActionPreference = "Stop"
$Report = [System.Collections.Generic.List[string]]::new()
function Add-Report([string]$Line) {
    $script:Report.Add($Line)
    Write-Host $Line
}
function Format-Size([long]$Bytes) {
    if ($Bytes -ge 1MB) { return "{0:N2} MB" -f ($Bytes / 1MB) }
    if ($Bytes -ge 1KB) { return "{0:N2} KB" -f ($Bytes / 1KB) }
    return "$Bytes B"
}
function Resolve-ToolExe([string]$Name) {
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = @(
        (Join-Path $env:WINDIR "System32\OpenSSH\$Name.exe")
        (Join-Path $env:WINDIR "System32\$Name.exe")
        "C:\Program Files\Git\usr\bin\$Name.exe"
        "C:\Program Files (x86)\Git\usr\bin\$Name.exe"
    )
    if ($Name -in @("psql", "pg_dump")) {
        $pg = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\$Name.exe" -ErrorAction SilentlyContinue |
            Sort-Object { [version]($_.Directory.Parent.Name -replace '\D', '.') } -Descending |
            Select-Object -First 1
        if ($pg) { return $pg.FullName }
    }
    foreach ($path in $candidates) {
        if (Test-Path $path) { return $path }
    }
    throw "Не найден $Name.exe (OpenSSH, Git или PostgreSQL)."
}
function Resolve-SshToolchain {
    $openSshDir = Join-Path $env:WINDIR "System32\OpenSSH"
    $winSsh = Join-Path $openSshDir "ssh.exe"
    $winScp = Join-Path $openSshDir "scp.exe"
    $winAdd = Join-Path $openSshDir "ssh-add.exe"
    $hasWinAdd = Test-Path $winAdd

    if (Test-Path $winSsh) {
        return @{
            Ssh            = $winSsh
            Scp            = if (Test-Path $winScp) { $winScp } else { Resolve-ToolExe "scp" }
            SshAdd         = if ($hasWinAdd) { $winAdd } else { $null }
            SshAgent       = $null
            UseWindowsSvc  = $hasWinAdd
            IsGitToolchain = $false
        }
    }

    $ssh = Resolve-ToolExe "ssh"
    $bin = Split-Path $ssh -Parent
    $scp = Join-Path $bin "scp.exe"
    if (-not (Test-Path $scp)) { $scp = Resolve-ToolExe "scp" }
    $gitAdd = Join-Path $bin "ssh-add.exe"
    $gitAgent = Join-Path $bin "ssh-agent.exe"

    return @{
        Ssh            = $ssh
        Scp            = $scp
        SshAdd         = if (Test-Path $gitAdd) { $gitAdd } else { $null }
        SshAgent       = if (Test-Path $gitAgent) { $gitAgent } else { $null }
        UseWindowsSvc  = $false
        IsGitToolchain = $true
    }
}
function Stop-WindowsSshAgentService {
    $service = Get-Service ssh-agent -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq "Running") {
        Add-Report "    Остановка службы Windows ssh-agent (конфликт с Git ssh-agent)..."
        Stop-Service ssh-agent -Force -ErrorAction SilentlyContinue
    }
}
function Start-GitSshAgentEnvironment {
    $sshAgentExe = $script:SshToolchain.SshAgent
    if (-not $sshAgentExe) { return $false }

    Stop-WindowsSshAgentService

    $agentOut = (& $sshAgentExe -s 2>&1 | Out-String).Trim()
    if ($agentOut -match 'SSH_AUTH_SOCK=([^;\r\n]+)') {
        $env:SSH_AUTH_SOCK = $Matches[1].Trim().Trim('"')
    }
    if ($agentOut -match 'SSH_AGENT_PID=(\d+)') {
        $env:SSH_AGENT_PID = $Matches[1]
    }
    if (-not $env:SSH_AUTH_SOCK) {
        Add-Report "    Git ssh-agent: не удалось получить SSH_AUTH_SOCK"
        return $false
    }
    return $true
}
function Add-KeyToSshAgent([string]$SshAddExe) {
    $listed = & $SshAddExe -l 2>&1
    $keyName = Split-Path $SshPrivateKeyPath -Leaf
    $keyLoaded = ($LASTEXITCODE -eq 0) -and ($listed -match ([regex]::Escape($keyName)))

    if (-not $keyLoaded) {
        Add-Report "ssh-add: введите passphrase (один раз до закрытия терминала)..."
        $addOut = & $SshAddExe $SshPrivateKeyPath 2>&1
        if ($LASTEXITCODE -ne 0) {
            Add-Report "    Ошибка ssh-add: $(($addOut | Out-String).Trim())"
            return $false
        }
    }
    else {
        Add-Report "ssh-add: ключ уже загружен"
    }
    return $true
}
function Get-SshBaseOptions {
    $opts = @(
        "-o", "ServerAliveInterval=30",
        "-o", "StrictHostKeyChecking=accept-new"
    )
    if (-not $script:SshKeyInAgent -and (Test-Path $SshPrivateKeyPath)) {
        $opts += "-i", $SshPrivateKeyPath, "-o", "IdentitiesOnly=yes"
    }
    return $opts
}
function Invoke-Ssh([string]$RemoteCommand) {
    $args = @(Get-SshBaseOptions) + @("${RemoteUser}@${RemoteHost}", $RemoteCommand)
    $result = & $SshExe @args 2>&1
    if ($LASTEXITCODE -ne 0) {
        $detail = ($result | Out-String).Trim()
        throw "ssh завершился с кодом $LASTEXITCODE`n$detail"
    }
    return $result
}
function Resolve-RemoteContainer([string[]]$Candidates) {
    $listed = Invoke-Ssh "docker ps -a --format '{{.Names}}'"
    $names = @(($listed | Out-String) -split '\r?\n' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    foreach ($candidate in $Candidates) {
        if ($names -contains $candidate) { return $candidate }
    }
    throw "На VPS нет контейнера ($($Candidates -join ' или ')). Запущены: $($names -join ', ')"
}
function Invoke-Scp([string]$Source, [string]$Destination) {
    $args = @(Get-SshBaseOptions) + @($Source, $Destination)
    $out = & $ScpExe @args 2>&1
    if ($LASTEXITCODE -ne 0) {
        $detail = ($out | Out-String).Trim()
        throw "scp завершился с кодом $LASTEXITCODE`n$detail"
    }
}
function Initialize-SshAgent {
    $script:SshKeyInAgent = $false
    if (-not $UseSshAgent) { return }
    if (-not (Test-Path $SshPrivateKeyPath)) {
        Add-Report "SSH-ключ не найден: $SshPrivateKeyPath (ssh-agent пропущен)"
        return
    }

    $sshAddExe = $script:SshToolchain.SshAdd
    if (-not $sshAddExe) {
        Add-Report "ssh-add не найден — passphrase на каждое ssh/scp"
        return
    }

    if ($script:SshToolchain.UseWindowsSvc) {
        $service = Get-Service ssh-agent -ErrorAction SilentlyContinue
        if (-not $service) {
            Add-Report "Служба ssh-agent не установлена (OpenSSH Authentication Agent)."
            return
        }
        if ($service.Status -ne "Running") {
            Set-Service ssh-agent -StartupType Automatic -ErrorAction SilentlyContinue
            Start-Service ssh-agent
        }
        Add-Report "ssh-agent: Windows ($sshAddExe)"
    }
    elseif ($script:SshToolchain.IsGitToolchain) {
        if (-not (Start-GitSshAgentEnvironment)) { return }
        Add-Report "ssh-agent: Git ($($script:SshToolchain.SshAgent))"
    }

    if (Add-KeyToSshAgent $sshAddExe) {
        $script:SshKeyInAgent = $true
    }
}
function Set-PgEnv {
    $env:PGPASSWORD = $LocalPgPassword
    $env:PGUSER = $LocalPgUser
}
function Clear-PgEnv {
    Remove-Item Env:PGPASSWORD, Env:PGUSER -ErrorAction SilentlyContinue
}
function Invoke-PgDump([string[]]$PgArguments) {
    Set-PgEnv
    try {
        & $PgDumpExe @PgArguments
        if ($LASTEXITCODE -ne 0) { throw "pg_dump завершился с кодом $LASTEXITCODE" }
    }
    finally { Clear-PgEnv }
}
function Confirm-Step([string]$Prompt) {
    $answer = Read-Host $Prompt
    return $answer -eq "yes"
}
function Get-DatedDumpFolders {
    @(Get-ChildItem -Path $ScriptDir -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}$' } |
        Sort-Object Name -Descending)
}
function Select-DumpSource {
    Write-Host ""
    Write-Host "Источник дампа:"
    Write-Host "  1. Локальная база ($LocalPgHost`:$LocalPgPort/$LocalPgDatabase)"
    Write-Host "  2. Файл из scripts/ГГГГ-ММ-ДД"
    $choice = Read-Host "Номер"
    if ($choice -eq "1") { return @{ Kind = "live" } }
    if ($choice -ne "2") { throw "Неизвестный выбор: $choice" }

    $folders = @(Get-DatedDumpFolders | Where-Object {
        @(Get-ChildItem -Path $_.FullName -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Extension -eq ".sql" -or $_.Name -like "*.sql.gz" }).Count -gt 0
    })
    if ($folders.Count -eq 0) { throw "Нет папок scripts/ГГГГ-ММ-ДД с файлами .sql или .sql.gz." }
    Write-Host ""
    Write-Host "Папка:"
    for ($i = 0; $i -lt $folders.Count; $i++) {
        Write-Host ("  {0}. {1}" -f ($i + 1), $folders[$i].Name)
    }
    $folderPick = Read-Host "Номер"
    if ($folderPick -notmatch '^\d+$') { throw "Нет такой папки." }
    $folderIndex = [int]$folderPick - 1
    if ($folderIndex -lt 0 -or $folderIndex -ge $folders.Count) { throw "Нет такой папки." }
    $folder = $folders[$folderIndex]

    $files = @(Get-ChildItem -Path $folder.FullName -Recurse -File |
        Where-Object { $_.Extension -eq ".sql" -or $_.Name -like "*.sql.gz" } |
        Sort-Object FullName)
    if ($files.Count -eq 0) { throw "В $($folder.Name) нет файлов .sql или .sql.gz." }
    Write-Host ""
    Write-Host "Файл ($($folder.Name)):"
    for ($i = 0; $i -lt $files.Count; $i++) {
        $rel = $files[$i].FullName.Substring($folder.FullName.Length).TrimStart('\')
        Write-Host ("  {0}. {1} ({2})" -f ($i + 1), $rel, (Format-Size $files[$i].Length))
    }
    $filePick = Read-Host "Номер"
    if ($filePick -notmatch '^\d+$') { throw "Нет такого файла." }
    $fileIndex = [int]$filePick - 1
    if ($fileIndex -lt 0 -or $fileIndex -ge $files.Count) { throw "Нет такого файла." }
    return @{ Kind = "file"; Path = $files[$fileIndex].FullName }
}
function Compress-Gzip([string]$Source, [string]$Destination) {
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $inStream = [System.IO.File]::OpenRead($Source)
    $outStream = [System.IO.File]::Create($Destination)
    $gzip = New-Object System.IO.Compression.GzipStream(
        $outStream, [System.IO.Compression.CompressionLevel]::Optimal)
    try { $inStream.CopyTo($gzip) }
    finally {
        $gzip.Dispose()
        $inStream.Dispose()
        $outStream.Dispose()
    }
}

$script:SshToolchain = Resolve-SshToolchain
$SshExe = $script:SshToolchain.Ssh
$ScpExe = $script:SshToolchain.Scp
$script:SshKeyInAgent = $false
$TarExe = Resolve-ToolExe "tar"
$RemoteSsh = "${RemoteUser}@${RemoteHost}"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
New-Item -ItemType Directory -Force -Path $LocalDumpDir | Out-Null

Add-Report "=== Заливка на VPS ($RemoteSsh) ==="
Add-Report "Время: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

$LocalSql = Join-Path $LocalDumpDir "portfolio_db_to_vps_$Timestamp.sql"
$LocalGz = "$LocalSql.gz"
$UploadsArchive = Join-Path $LocalDumpDir "uploads_to_vps_$Timestamp.tar"
$RemoteGz = "/home/$RemoteUser/portfolio_db_to_vps_$Timestamp.sql.gz"
$RemoteTar = "/home/$RemoteUser/uploads_to_vps_$Timestamp.tar"
$RemoteSafety = "$RemoteProject/backups/portfolio_db_before_push_$Timestamp.sql.gz"
$dbRestored = $false
$uploadsReplaced = $false

try {
    Initialize-SshAgent
    if ($script:SshKeyInAgent) {
        Add-Report "SSH: ключ в ssh-agent"
    }
    else {
        Add-Report "SSH: без agent — passphrase при каждом подключении"
    }
    $RemoteDbContainer = Resolve-RemoteContainer @("catshredia-blog-db", "portfolio-db")
    $RemoteWebContainer = Resolve-RemoteContainer @("catshredia-blog-web", "portfolio-web")
    Add-Report "Контейнеры на VPS: $RemoteDbContainer, $RemoteWebContainer"

    $source = Select-DumpSource
    Add-Report ""
    if ($source.Kind -eq "live") {
        Add-Report "[1] Дамп локальной базы ($LocalPgHost`:$LocalPgPort/$LocalPgDatabase)..."
        $PgDumpExe = Resolve-ToolExe "pg_dump"
        Invoke-PgDump @(
            "-h", $LocalPgHost, "-p", "$LocalPgPort", "-U", $LocalPgUser,
            "-d", $LocalPgDatabase, "-f", $LocalSql
        )
        Compress-Gzip $LocalSql $LocalGz
        Remove-Item $LocalSql -Force
    }
    else {
        Add-Report "[1] Дамп из файла: $($source.Path)"
        if ($source.Path -like "*.sql.gz") {
            $LocalGz = $source.Path
        }
        else {
            Compress-Gzip $source.Path $LocalGz
            Add-Report "    Сжат для отправки: $LocalGz"
        }
    }
    $dumpSize = (Get-Item $LocalGz).Length
    if ($dumpSize -lt 128) { throw "Дамп слишком мал ($dumpSize байт)." }
    Add-Report "    Файл: $LocalGz"
    Add-Report "    Размер: $(Format-Size $dumpSize)"

    $uploadFiles = @(Get-ChildItem -Path $LocalUploadsDir -Recurse -File -ErrorAction SilentlyContinue)
    Add-Report ""
    Add-Report "[2] Архив локальных uploads ($($uploadFiles.Count) файлов)..."
    if ($uploadFiles.Count -gt 0) {
        & $TarExe -cf $UploadsArchive -C $LocalUploadsDir .
        if ($LASTEXITCODE -ne 0) { throw "tar завершился с кодом $LASTEXITCODE" }
        Add-Report "    Файл: $UploadsArchive ($(Format-Size (Get-Item $UploadsArchive).Length))"
    }
    else {
        Add-Report "    Локальный uploads пуст — на сервер файлы не отправляются."
    }

    if ($RunRemoteBackupFirst) {
        Add-Report ""
        Add-Report "[3] Страховочный дамп базы на VPS..."
        Invoke-Ssh "bash -c `"set -o pipefail; mkdir -p '$RemoteProject/backups' && docker exec $RemoteDbContainer pg_dump -U postgres $LocalPgDatabase | gzip > '$RemoteSafety'`""
        Add-Report "    $RemoteSafety"
    }

    Add-Report ""
    Write-Host "ВНИМАНИЕ: база '$LocalPgDatabase' в контейнере $RemoteDbContainer будет удалена и заменена выбранным дампом." -ForegroundColor Yellow
    Write-Host "Сайт на время заливки останавливается ($RemoteWebContainer)."
    if ($ConfirmBeforeRemoteDbReset) {
        if (-not (Confirm-Step "Введите yes для замены базы на VPS (иначе — отмена)")) {
            throw "Замена базы на VPS отменена."
        }
    }

    Add-Report "[4] Заливка и восстановление базы..."
    $webStopped = $false
    try {
        Invoke-Ssh "docker stop $RemoteWebContainer"
        $webStopped = $true
        Invoke-Scp $LocalGz "${RemoteSsh}:${RemoteGz}"
        Invoke-Ssh "docker exec $RemoteDbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c `"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$LocalPgDatabase' AND pid <> pg_backend_pid();`""
        Invoke-Ssh "docker exec $RemoteDbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c `"DROP DATABASE IF EXISTS $LocalPgDatabase;`""
        Invoke-Ssh "docker exec $RemoteDbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c `"CREATE DATABASE $LocalPgDatabase OWNER postgres;`""
        Invoke-Ssh "bash -c `"set -o pipefail; gunzip -c '$RemoteGz' | docker exec -i $RemoteDbContainer psql -U postgres -d $LocalPgDatabase -v ON_ERROR_STOP=1`""
        $dbRestored = $true
        $userCount = (Invoke-Ssh "docker exec $RemoteDbContainer psql -U postgres -d $LocalPgDatabase -t -A -c 'SELECT COUNT(*) FROM `"User`";'").Trim()
        Add-Report "    База залита. Записей в User: $userCount"
    }
    finally {
        if ($webStopped) { Invoke-Ssh "docker start $RemoteWebContainer" }
        Invoke-Ssh "rm -f '$RemoteGz'"
    }

    if ($uploadFiles.Count -gt 0) {
        Add-Report ""
        Write-Host "ВНИМАНИЕ: $RemoteUploadsPath в $RemoteWebContainer будет очищен и заменён локальными файлами." -ForegroundColor Yellow
        if ($ConfirmBeforeRemoteUploadsReset) {
            if (-not (Confirm-Step "Введите yes для замены uploads на VPS (иначе — пропуск)")) {
                Add-Report "[5] Замена uploads пропущена."
            }
            else {
                Add-Report "[5] Замена uploads..."
                Invoke-Scp $UploadsArchive "${RemoteSsh}:${RemoteTar}"
                Invoke-Ssh "docker exec $RemoteWebContainer sh -c 'find $RemoteUploadsPath -mindepth 1 -maxdepth 1 -exec rm -rf {} +'"
                Invoke-Ssh "docker exec -i $RemoteWebContainer tar -xf - -C $RemoteUploadsPath < '$RemoteTar'"
                Invoke-Ssh "rm -f '$RemoteTar'"
                $uploadsReplaced = $true
                Add-Report "    Заменено файлов: $($uploadFiles.Count)"
            }
        }
    }
}
finally {
    if ($script:SshToolchain.SshAgent -and $env:SSH_AGENT_PID) {
        Stop-Process -Id $env:SSH_AGENT_PID -Force -ErrorAction SilentlyContinue
    }
}

Add-Report ""
Add-Report "=== Итог ==="
Add-Report "| Локальный дамп | $LocalGz"
Add-Report "| Страховочный дамп на VPS | $(if ($RunRemoteBackupFirst) { $RemoteSafety } else { "нет" })"
Add-Report "| База на VPS заменена | $(if ($dbRestored) { "да" } else { "нет" })"
Add-Report "| Uploads на VPS заменены | $(if ($uploadsReplaced) { "да" } else { "нет" })"
$ReportPath = Join-Path $LocalDumpDir "push-report_$Timestamp.txt"
$Report | Set-Content -Path $ReportPath -Encoding UTF8
Add-Report ""
Add-Report "Отчёт: $ReportPath"
