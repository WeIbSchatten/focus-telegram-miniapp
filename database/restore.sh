#!/bin/bash
# Скрипт для восстановления базы данных из бэкапа

set -e

if [ -z "$1" ]; then
  echo "Использование: ./restore.sh <путь_к_бэкапу.sql.gz>"
  echo "Пример: ./restore.sh ./backups/focus_db_backup_20250129_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="focus-db"
DB_NAME="focus_db"
DB_USER="focus"

# Проверяем существование файла
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Ошибка: файл ${BACKUP_FILE} не найден"
  exit 1
fi

echo "Восстановление базы данных из ${BACKUP_FILE}..."
echo "ВНИМАНИЕ: Это перезапишет все данные в базе ${DB_NAME}!"
read -p "Продолжить? (yes/no): " confirm

if [ "${confirm}" != "yes" ]; then
  echo "Отменено."
  exit 0
fi

# Распаковываем если нужно
TEMP_FILE="${BACKUP_FILE}"
if [[ "${BACKUP_FILE}" == *.gz ]]; then
  echo "Распаковка бэкапа..."
  TEMP_FILE="/tmp/restore_$(basename ${BACKUP_FILE} .gz)"
  gunzip -c "${BACKUP_FILE}" > "${TEMP_FILE}"
fi

# Восстанавливаем через psql
echo "Восстановление данных..."
cat "${TEMP_FILE}" | docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME}

# Удаляем временный файл если создавали
if [[ "${BACKUP_FILE}" == *.gz ]]; then
  rm -f "${TEMP_FILE}"
fi

echo "✓ База данных восстановлена!"
