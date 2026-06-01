# Скачивание бэкапа и uploads с VPS → восстановление в локальную PostgreSQL.
# Запуск: .\scripts\sync-from-vps.ps1
# Требуется: ssh/scp, pg_dump, psql (PostgreSQL client или Git).

# --- Настройки ---
$RemoteUser = "deploy"
$RemoteHost = "147.45.246.115"
$RemoteProject = "/home/deploy/catshredias-blog"
$RemoteBackupFile = "portfolio_db_20260528_235409.sql.gz"

$RemoteWebContainer = "portfolio-web"
$RemoteUploadsPath = "/app/uploads"

$LocalProjectRoot = "C:\directory-git\linux\catshredias-blog"
$LocalDownloadDir = "C:\Users\catsh\Downloads\vps-sync"
$LocalUploadsDir = "$LocalProjectRoot\uploads"
$LocalBackupDir = "$LocalProjectRoot\backups"

$LocalPgHost = "localhost"
$LocalPgPort = 5432
$LocalPgUser = "postgres"
$LocalPgPassword = "qwerty123"
$LocalPgDatabase = "portfolio_db"

# SSH-ключ с passphrase: один раз за сессию Windows через ssh-agent
$UseSshAgent = $true
$SshPrivateKeyPath = "$env:USERPROFILE\.ssh\id_ed25519_github"

$RunRemoteBackupFirst = $false
$RestoreVpsBackupToLocal = $true
$ConfirmBeforeDbReset = $true
$ConfirmBeforeUploadsReset = $true

# --- Скрипт ---
$ErrorActionPreference = "Stop"
$Report = [System.Collections.Generic.List[string]]::new()

function Add-Report([string]$Line) {
    $script:Report.Add($Line)
    Write-Host $Line
}

function Get-RemoteBackupPath {
    if ($RemoteBackupFile -match "^/") { return $RemoteBackupFile }
    return "$RemoteProject/backups/$RemoteBackupFile"
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

function Initialize-SshAgent {
    if (-not $UseSshAgent) { return }
    if (-not (Test-Path $SshPrivateKeyPath)) {
        Add-Report "SSH-ключ не найден: $SshPrivateKeyPath (ssh-agent пропущен)"
        return
    }

    $service = Get-Service ssh-agent -ErrorAction SilentlyContinue
    if (-not $service) {
        Add-Report "Служба ssh-agent не установлена. Passphrase будет запрашиваться при каждом ssh/scp."
        Add-Report "Установите: Параметры → Доп. компоненты → OpenSSH Authentication Agent"
        return
    }

    if ($service.Status -ne "Running") {
        Set-Service ssh-agent -StartupType Manual
        Start-Service ssh-agent
    }

    $sshAddExe = Resolve-ToolExe "ssh-add"
    Add-Report "ssh-agent: добавление ключа через $sshAddExe"
    Add-Report "    (passphrase — один раз до перезагрузки/выхода)"
    & $sshAddExe $SshPrivateKeyPath
    if ($LASTEXITCODE -ne 0) {
        throw "ssh-add не удался. Проверьте путь к ключу и passphrase."
    }
    & $sshAddExe -l
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

$SshExe = Resolve-ToolExe "ssh"
$ScpExe = Resolve-ToolExe "scp"
$SshAddExe = Resolve-ToolExe "ssh-add"
$TarExe = Resolve-ToolExe "tar"
$PgDumpExe = Resolve-ToolExe "pg_dump"
$PsqlExe = Resolve-ToolExe "psql"

$RemoteSsh = "${RemoteUser}@${RemoteHost}"
$RemoteBackupPath = Get-RemoteBackupPath
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

New-Item -ItemType Directory -Force -Path $LocalDownloadDir, $LocalBackupDir, $LocalUploadsDir | Out-Null

Add-Report "=== Синхронизация с VPS ($RemoteSsh) ==="
Add-Report "Время: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Report "ssh: $SshExe | scp: $ScpExe | psql: $PsqlExe"

Initialize-SshAgent

# [1] Локальный бэкап ДО перезаписи данных
Add-Report ""
Add-Report "[1] Локальный бэкап БД ($LocalPgHost`:$LocalPgPort/$LocalPgDatabase)..."
$LocalSqlBackup = Join-Path $LocalBackupDir "portfolio_db_local_${Timestamp}.sql"
Invoke-PgDump @("-h", $LocalPgHost, "-p", "$LocalPgPort", "-U", $LocalPgUser, "-d", $LocalPgDatabase, "-f", $LocalSqlBackup)
$localSize = (Get-Item $LocalSqlBackup).Length
Add-Report "    Файл: $LocalSqlBackup"
Add-Report "    Размер: $(Format-Size $localSize)"

if ($RunRemoteBackupFirst) {
    Add-Report ""
    Add-Report "[2] Бэкап на VPS..."
    & $SshExe $RemoteSsh "cd '$RemoteProject' && bash scripts/backup-db.sh"
    Add-Report "    Готово. Обновите RemoteBackupFile на имя нового файла."
}

# [3] Скачать бэкап с VPS
Add-Report ""
Add-Report "[3] Скачивание бэкапа БД..."
$LocalDbBackup = Join-Path $LocalDownloadDir (Split-Path $RemoteBackupFile -Leaf)
& $ScpExe "${RemoteSsh}:${RemoteBackupPath}" $LocalDbBackup
$dbSize = (Get-Item $LocalDbBackup).Length
Add-Report "    Файл: $LocalDbBackup"
Add-Report "    Размер: $(Format-Size $dbSize)"

# [4] Uploads
Add-Report ""
Add-Report "[4] Скачивание uploads..."
$RemoteUploadsTar = "/home/$RemoteUser/uploads_sync_$Timestamp.tar"
$UploadsArchive = Join-Path $LocalDownloadDir "uploads_$Timestamp.tar"
& $SshExe $RemoteSsh "docker exec $RemoteWebContainer tar -cf - -C $RemoteUploadsPath . > '$RemoteUploadsTar'"
& $ScpExe "${RemoteSsh}:${RemoteUploadsTar}" $UploadsArchive
& $SshExe $RemoteSsh "rm -f '$RemoteUploadsTar'"

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

# [5] Восстановление дампа VPS в локальную БД
$restoreRows = "—"
if ($RestoreVpsBackupToLocal) {
    Add-Report ""
    Add-Report "[5] Восстановление VPS-дампа в локальную БД..."

    $SqlRestore = Join-Path $LocalDownloadDir "portfolio_db_restore_${Timestamp}.sql"
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
