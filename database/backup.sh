#!/bin/bash
# Скрипт для создания бэкапа базы данных Focus

set -e

# Конфигурация
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/focus_db_backup_${TIMESTAMP}.sql"
CONTAINER_NAME="focus-db"
DB_NAME="focus_db"
DB_USER="focus"

# Создаём папку для бэкапов если её нет
mkdir -p "${BACKUP_DIR}"

echo "Создание бэкапа базы данных ${DB_NAME}..."

# Создаём бэкап через pg_dump внутри контейнера
docker exec ${CONTAINER_NAME} pg_dump -U ${DB_USER} -d ${DB_NAME} > "${BACKUP_FILE}"

# Сжимаем бэкап
gzip "${BACKUP_FILE}"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

echo "✓ Бэкап создан: ${BACKUP_FILE_GZ}"
echo "Размер: $(du -h "${BACKUP_FILE_GZ}" | cut -f1)"

# Опционально: удаляем старые бэкапы (старше 7 дней)
find "${BACKUP_DIR}" -name "focus_db_backup_*.sql.gz" -mtime +7 -delete 2>/dev/null || true

echo "Готово!"
