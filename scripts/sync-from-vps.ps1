# Скачивание бэкапа и uploads с VPS → восстановление в локальную PostgreSQL.
# Запуск: .\scripts\sync-from-vps.ps1
# Требуется: ssh/scp, pg_dump, psql (PostgreSQL client или Git).
#
# Дампы БД:  <папка скрипта>\<yyyy-MM-dd>\local\  — локальная БД до синка
#            <папка скрипта>\<yyyy-MM-dd>\vps\    — дамп с VPS (скачанный)
# --- Настройки ---
$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) { $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path }
$DateFolder = Get-Date -Format "yyyy-MM-dd"
$DumpLocalDir = Join-Path $ScriptDir "$DateFolder\local"
$DumpVpsDir = Join-Path $ScriptDir "$DateFolder\vps"
# SSH: пользователь и IP VPS
$RemoteUser = "deploy"
$RemoteHost = "147.45.246.115"
# Каталог проекта на сервере (где лежит backups/ и docker-compose)
$RemoteProject = "/home/deploy/catshredias-blog"
# Имя файла дампа в $RemoteProject/backups/ (пусто = взять самый новый portfolio_db_*.sql.gz)
$RemoteBackupFile = ""
# Docker: контейнер Next.js и путь к загрузкам внутри контейнера
$RemoteWebContainer = "portfolio-web"
$RemoteUploadsPath = "/app/uploads"
# Корень репозитория на ПК (родитель scripts/)
$LocalProjectRoot = Split-Path $ScriptDir -Parent
# Куда скачиваются архив uploads и отчёт sync-report_*.txt
$LocalDownloadDir = Join-Path $ScriptDir "$DateFolder\sync"
# Локальные файлы сайта (обложки, аватары) — перезаписываются с VPS
$LocalUploadsDir = Join-Path $LocalProjectRoot "uploads"
# Локальная PostgreSQL (docker compose up -d db, порт из docker-compose.yml)
$LocalPgHost = "localhost"
$LocalPgPort = 55433
$LocalPgUser = "postgres"
$LocalPgPassword = "postgres"
$LocalPgDatabase = "portfolio_db"
# SSH-ключ с passphrase: один раз за сессию через ssh-agent
$UseSshAgent = $true
$SshPrivateKeyPath = "$env:USERPROFILE\.ssh\id_ed25519"
# $true — перед скачиванием выполнить на VPS scripts/backup-db.sh
$RunRemoteBackupFirst = $true
# $true — DROP/CREATE локальной БД и залить скачанный дамп; $false — только скачать файлы
$RestoreVpsBackupToLocal = $true
# Запрос yes перед сбросом локальной БД
$ConfirmBeforeDbReset = $true
# Запрос yes перед очисткой uploads и распаковкой архива с VPS
$ConfirmBeforeUploadsReset = $true
# --- Скрипт ---
$ErrorActionPreference = "Stop"
$Report = [System.Collections.Generic.List[string]]::new()
function Add-Report([string]$Line) {
    $script:Report.Add($Line)
    Write-Host $Line
}
function Get-RemoteBackupPath {
    param([string]$FileName)
    if ($FileName -match "^/") { return $FileName }
    return "$RemoteProject/backups/$FileName"
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
        Add-Report "    $agentOut"
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
    & $SshAddExe -l 2>&1
    return $true
}
function Get-SshBaseOptions {
    $opts = @(
        "-o", "ServerAliveInterval=30",
        "-o", "StrictHostKeyChecking=accept-new"
    )
    # ControlMaster на Git для Windows нестабилен (mux_client_request_session / reset by peer)
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
        Add-Report "    Установите OpenSSH Client: Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0"
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
function Get-LatestRemoteBackupFileName {
    $remoteDir = "$RemoteProject/backups"
    $cmd = "ls -t '$remoteDir'/portfolio_db_*.sql.gz 2>/dev/null | head -1"
    $args = @(Get-SshBaseOptions) + @("${RemoteUser}@${RemoteHost}", $cmd)
    $fullPath = (& $SshExe @args).Trim()
    if ($LASTEXITCODE -ne 0 -or -not $fullPath) {
        throw "На VPS не найден portfolio_db_*.sql.gz в $remoteDir"
    }
    return Split-Path $fullPath -Leaf
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
function Invoke-Psql([string[]]$PgArguments) {
    Set-PgEnv
    try {
        & $PsqlExe @PgArguments
        if ($LASTEXITCODE -ne 0) { throw "psql завершился с кодом $LASTEXITCODE" }
    }
    finally { Clear-PgEnv }
}
function Confirm-LocalDbReset {
    Write-Host ""
    Write-Host "ВНИМАНИЕ: локальная база '$LocalPgDatabase' ($LocalPgHost`:$LocalPgPort) будет полностью удалена." -ForegroundColor Yellow
    Write-Host "Копия до синхронизации: $LocalSqlBackup"
    $answer = Read-Host "Введите yes для сброса БД и заливки дампа с VPS (иначе — отмена)"
    if ($answer -ne "yes") {
        throw "Сброс локальной БД отменён пользователем."
    }
}
function Confirm-LocalUploadsReset {
    Write-Host ""
    Write-Host "ВНИМАНИЕ: локальный каталог uploads будет полностью очищен." -ForegroundColor Yellow
    Write-Host "Путь: $LocalUploadsDir"
    Write-Host "После подтверждения распакуется архив с VPS (старые файлы, которых нет на сервере, будут удалены)."
    $answer = Read-Host "Введите yes для очистки uploads и распаковки с VPS (иначе — отмена)"
    if ($answer -ne "yes") {
        throw "Очистка uploads отменена пользователем."
    }
}
function Reset-LocalUploads {
    if (Test-Path $LocalUploadsDir) {
        Get-ChildItem -Path $LocalUploadsDir -Force | Remove-Item -Recurse -Force
    }
    else {
        New-Item -ItemType Directory -Force -Path $LocalUploadsDir | Out-Null
    }
    Add-Report "    Каталог uploads очищен: $LocalUploadsDir"
}
function Reset-LocalDatabase {
    Add-Report "    Отключение сессий..."
    $terminateSql = @"
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$LocalPgDatabase' AND pid <> pg_backend_pid();
"@
    Invoke-Psql @(
        "-h", $LocalPgHost, "-p", "$LocalPgPort", "-U", $LocalPgUser,
        "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", $terminateSql
    )
    Add-Report "    DROP DATABASE + CREATE DATABASE..."
    Invoke-Psql @(
        "-h", $LocalPgHost, "-p", "$LocalPgPort", "-U", $LocalPgUser,
        "-d", "postgres", "-v", "ON_ERROR_STOP=1",
        "-c", "DROP DATABASE IF EXISTS $LocalPgDatabase;"
    )
    Invoke-Psql @(
        "-h", $LocalPgHost, "-p", "$LocalPgPort", "-U", $LocalPgUser,
        "-d", "postgres", "-v", "ON_ERROR_STOP=1",
        "-c", "CREATE DATABASE $LocalPgDatabase OWNER $LocalPgUser;"
    )
    Add-Report "    База $LocalPgDatabase пересоздана (пустая)."
}
function Expand-GzipToSql([string]$GzipPath, [string]$SqlPath) {
    if (Test-Path $SqlPath) { Remove-Item $SqlPath -Force }
    try {
        $GzipExe = Resolve-ToolExe "gzip"
        & $GzipExe -dk $GzipPath
        $generated = $GzipPath -replace '\.gz$', ''
        if ($generated -ne $SqlPath -and (Test-Path $generated)) {
            Move-Item $generated $SqlPath -Force
        }
        return
    }
    catch {
        Add-Report "    gzip.exe не найден, распаковка через .NET..."
    }
    $inStream = [System.IO.File]::OpenRead($GzipPath)
    $gzip = New-Object System.IO.Compression.GzipStream(
        $inStream, [System.IO.Compression.CompressionMode]::Decompress)
    $outStream = [System.IO.File]::Create($SqlPath)
    try { $gzip.CopyTo($outStream) }
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
$PgDumpExe = Resolve-ToolExe "pg_dump"
$PsqlExe = Resolve-ToolExe "psql"
$RemoteSsh = "${RemoteUser}@${RemoteHost}"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
New-Item -ItemType Directory -Force -Path $DumpLocalDir, $DumpVpsDir, $LocalDownloadDir, $LocalUploadsDir | Out-Null
Add-Report "=== Синхронизация с VPS ($RemoteSsh) ==="
Add-Report "Время: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Report "Каталог дампов: $ScriptDir\$DateFolder\"
Add-Report "ssh: $SshExe | scp: $ScpExe | psql: $PsqlExe"
try {
Initialize-SshAgent
if ($script:SshKeyInAgent) {
    Add-Report "SSH: ключ в ssh-agent (passphrase не нужен для ssh/scp)"
}
else {
    Add-Report "SSH: без agent — passphrase при каждом подключении"
}
# [1] Локальный бэкап ДО перезаписи данных
Add-Report ""
Add-Report "[1] Локальный бэкап БД ($LocalPgHost`:$LocalPgPort/$LocalPgDatabase)..."
$LocalSqlBackup = Join-Path $DumpLocalDir "portfolio_db_local_${Timestamp}.sql"
Invoke-PgDump @("-h", $LocalPgHost, "-p", "$LocalPgPort", "-U", $LocalPgUser, "-d", $LocalPgDatabase, "-f", $LocalSqlBackup)
$localSize = (Get-Item $LocalSqlBackup).Length
Add-Report "    Файл: $LocalSqlBackup"
Add-Report "    Размер: $(Format-Size $localSize)"
if ($RunRemoteBackupFirst) {
    Add-Report ""
    Add-Report "[2] Бэкап на VPS (docker portfolio-db)..."
    $backupOut = Invoke-Ssh "cd '$RemoteProject' && bash scripts/backup-db.sh"
    Add-Report (($backupOut | Out-String).Trim())
}
# [3] Скачать бэкап с VPS
Add-Report ""
Add-Report "[3] Скачивание бэкапа БД с VPS..."
if ([string]::IsNullOrWhiteSpace($RemoteBackupFile)) {
    $RemoteBackupFile = Get-LatestRemoteBackupFileName
    Add-Report "    Автовыбор файла: $RemoteBackupFile"
}
$RemoteBackupPath = Get-RemoteBackupPath $RemoteBackupFile
$LocalDbBackup = Join-Path $DumpVpsDir (Split-Path $RemoteBackupFile -Leaf)
Invoke-Scp "${RemoteSsh}:${RemoteBackupPath}" $LocalDbBackup
$dbSize = (Get-Item $LocalDbBackup).Length
Add-Report "    Файл: $LocalDbBackup"
Add-Report "    Размер: $(Format-Size $dbSize)"
# [4] Uploads
Add-Report ""
Add-Report "[4] Скачивание uploads..."
$RemoteUploadsTar = "/home/$RemoteUser/uploads_sync_$Timestamp.tar"
$UploadsArchive = Join-Path $LocalDownloadDir "uploads_$Timestamp.tar"
Invoke-Ssh "docker exec $RemoteWebContainer tar -cf - -C $RemoteUploadsPath . > '$RemoteUploadsTar'"
Invoke-Scp "${RemoteSsh}:${RemoteUploadsTar}" $UploadsArchive
Invoke-Ssh "rm -f '$RemoteUploadsTar'"

}
finally {
    if ($script:SshToolchain.SshAgent -and $env:SSH_AGENT_PID) {
        Stop-Process -Id $env:SSH_AGENT_PID -Force -ErrorAction SilentlyContinue
    }
}

$uploadCountBefore = (Get-ChildItem -Path $LocalUploadsDir -Recurse -File -ErrorAction SilentlyContinue).Count
Add-Report "    Файлов до очистки: $uploadCountBefore"
if ($ConfirmBeforeUploadsReset) {
    Confirm-LocalUploadsReset
}
Reset-LocalUploads
if ((Get-Item $UploadsArchive).Length -gt 512) {
    & $TarExe -xf $UploadsArchive -C $LocalUploadsDir
}
else {
    Add-Report "    Архив пуст — на сервере нет файлов в uploads."
}
Remove-Item $UploadsArchive -Force -ErrorAction SilentlyContinue
$uploadCountAfter = (Get-ChildItem -Path $LocalUploadsDir -Recurse -File -ErrorAction SilentlyContinue).Count
$uploadsSize = (Get-ChildItem -Path $LocalUploadsDir -Recurse -File -ErrorAction SilentlyContinue |
    Measure-Object -Property Length -Sum).Sum
$uploadsSizeVal = if ($null -ne $uploadsSize) { $uploadsSize } else { 0 }
Add-Report "    Каталог: $LocalUploadsDir"
Add-Report "    Файлов: $uploadCountAfter (было: $uploadCountBefore), $(Format-Size $uploadsSizeVal)"
# [5] Восстановление дампа VPS в локальную PostgreSQL (Docker, порт $LocalPgPort)
$restoreRows = "—"
if ($RestoreVpsBackupToLocal) {
    Add-Report ""
    Add-Report "[5] Восстановление VPS-дампа в локальную БД ($LocalPgHost`:$LocalPgPort/$LocalPgDatabase)..."
    $SqlRestore = Join-Path $DumpVpsDir "portfolio_db_restore_${Timestamp}.sql"
    if ($LocalDbBackup -match '\.gz$') {
        Expand-GzipToSql $LocalDbBackup $SqlRestore
    }
    else {
        Copy-Item $LocalDbBackup $SqlRestore -Force
    }
    Add-Report "    SQL: $SqlRestore ($(Format-Size (Get-Item $SqlRestore).Length))"
    if ($ConfirmBeforeDbReset) {
        Confirm-LocalDbReset
    }
    Reset-LocalDatabase
    Add-Report "    Импорт дампа (psql -f)..."
    Invoke-Psql @(
        "-h", $LocalPgHost, "-p", "$LocalPgPort", "-U", $LocalPgUser,
        "-d", $LocalPgDatabase, "-v", "ON_ERROR_STOP=1", "-f", $SqlRestore
    )
    Set-PgEnv
    $restoreRows = (& $PsqlExe -h $LocalPgHost -p $LocalPgPort -U $LocalPgUser -d $LocalPgDatabase `
        -t -A -c 'SELECT COUNT(*) FROM "User";').Trim()
    Clear-PgEnv
    Add-Report "    Готово. Записей в User: $restoreRows"
}
else {
    Add-Report ""
    Add-Report "[5] Восстановление в локальную БД отключено (RestoreVpsBackupToLocal = `$false)"
}
# [6] Итог
Add-Report ""
Add-Report "=== Итог ==="
Add-Report "| Шаг | Результат"
Add-Report "|-----|----------"
Add-Report "| Локальный бэкап (до sync) | $LocalSqlBackup"
Add-Report "| Дамп с VPS | $LocalDbBackup"
Add-Report "| Uploads очищены и залиты с VPS | $LocalUploadsDir ($uploadCountAfter файлов, было: $uploadCountBefore)"
Add-Report "| Локальная БД сброшена и залита с VPS | $(if ($RestoreVpsBackupToLocal) { "да, User: $restoreRows" } else { "нет" })"
$ReportPath = Join-Path $LocalDownloadDir "sync-report_$Timestamp.txt"
$Report | Set-Content -Path $ReportPath -Encoding UTF8
Add-Report ""
Add-Report "Отчёт: $ReportPath"
