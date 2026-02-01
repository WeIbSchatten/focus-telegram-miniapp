# PowerShell скрипт для создания бэкапа базы данных Focus (Windows)

param(
  [string]$ContainerName = "focus-db",
  [string]$DbName = "focus_db",
  [string]$DbUser = "focus",
  [string]$BackupDir = ".\backups"
)

$ErrorActionPreference = "Stop"

# Создаём папку для бэкапов
if (-not (Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "focus_db_backup_${Timestamp}.sql"

Write-Host "Создание бэкапа базы данных ${DbName}..." -ForegroundColor Cyan

# Создаём бэкап
docker exec ${ContainerName} pg_dump -U ${DbUser} -d ${DbName} | Out-File -FilePath $BackupFile -Encoding UTF8

# Сжимаем бэкап (требует 7-Zip или Compress-Archive)
$BackupFileGz = "${BackupFile}.gz"
try {
  # Пробуем использовать 7-Zip если установлен
  $7zip = Get-Command 7z -ErrorAction SilentlyContinue
  if ($7zip) {
    & 7z a -tgzip "${BackupFileGz}" "${BackupFile}" | Out-Null
    Remove-Item $BackupFile
    $BackupFile = $BackupFileGz
  } else {
    # Или используем встроенный Compress-Archive (создаёт .zip)
    $BackupFileZip = "${BackupFile}.zip"
    Compress-Archive -Path $BackupFile -DestinationPath $BackupFileZip -Force
    Remove-Item $BackupFile
    $BackupFile = $BackupFileZip
  }
} catch {
  Write-Warning "Не удалось сжать бэкап, сохранён как .sql"
}

$FileSize = (Get-Item $BackupFile).Length / 1MB
Write-Host "✓ Бэкап создан: $BackupFile" -ForegroundColor Green
Write-Host "Размер: $([math]::Round($FileSize, 2)) MB" -ForegroundColor Gray

# Удаляем старые бэкапы (старше 7 дней)
Get-ChildItem -Path $BackupDir -Filter "focus_db_backup_*" | 
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
  Remove-Item -Force

Write-Host "Готово!" -ForegroundColor Green
