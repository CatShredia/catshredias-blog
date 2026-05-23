$BackupDir = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { ".\backups" }
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$File = Join-Path $BackupDir "portfolio_db_$Timestamp.sql.gz"

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

docker exec portfolio-db pg_dump -U postgres portfolio_db |
  gzip > $File

Write-Host "Backup saved: $File"
