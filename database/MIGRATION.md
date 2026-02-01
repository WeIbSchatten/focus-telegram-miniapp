# Миграция данных при переезде на другой хостинг

## ⚠️ Важно: данные НЕ переносятся автоматически

При переезде на новый хостинг **данные из Docker volume не переносятся автоматически**. Нужно сделать бэкап и восстановить его на новом сервере.

## Как устроено сейчас

В `docker-compose.yml` используется **именованный volume** `focus-db-data`:

```yaml
volumes:
  focus-db-data:  # Данные хранятся в этом volume
```

Этот volume:
- ✅ **Сохраняет данные** при перезапуске контейнеров на том же сервере
- ✅ **Сохраняет данные** при `docker-compose down` и `docker-compose up`
- ❌ **НЕ переносится** автоматически на другой сервер
- ❌ **Удаляется** при `docker-compose down -v` (с флагом `-v`)

## Процесс миграции данных

### Шаг 1: Создание бэкапа на старом сервере

#### Linux/Mac:
```bash
cd database
chmod +x backup.sh
./backup.sh
```

#### Windows (PowerShell):
```powershell
cd database
.\backup.ps1
```

Бэкап сохранится в `database/backups/focus_db_backup_YYYYMMDD_HHMMSS.sql.gz`

### Шаг 2: Копирование бэкапа на новый сервер

```bash
# Через SCP
scp database/backups/focus_db_backup_*.sql.gz user@new-server:/path/to/project/database/backups/

# Или через rsync
rsync -avz database/backups/ user@new-server:/path/to/project/database/backups/
```

### Шаг 3: Восстановление на новом сервере

1. **Разверните проект на новом сервере:**
   ```bash
   git clone <your-repo>
   cd Focus-Telegram-MiniApp-1
   docker-compose up -d
   ```

2. **Дождитесь запуска БД** (несколько секунд)

3. **Восстановите данные:**

   Linux/Mac:
   ```bash
   cd database
   chmod +x restore.sh
   ./restore.sh ./backups/focus_db_backup_YYYYMMDD_HHMMSS.sql.gz
   ```

   Windows:
   ```powershell
   # Распакуйте .gz вручную или используйте WSL
   # Затем:
   cat backup.sql | docker exec -i focus-db psql -U focus -d focus_db
   ```

### Шаг 4: Проверка

```bash
# Проверьте что данные восстановились
docker exec -it focus-db psql -U focus -d focus_db -c "SELECT COUNT(*) FROM users;"
docker exec -it focus-db psql -U focus -d focus_db -c "SELECT COUNT(*) FROM students;"
```

## Автоматизация бэкапов

### Рекомендуется настроить автоматические бэкапы:

#### Вариант 1: Cron (Linux)
```bash
# Добавьте в crontab (crontab -e):
0 2 * * * cd /path/to/project/database && ./backup.sh
```

#### Вариант 2: Systemd Timer (Linux)
Создайте `/etc/systemd/system/focus-backup.service`:
```ini
[Unit]
Description=Focus Database Backup

[Service]
Type=oneshot
ExecStart=/path/to/project/database/backup.sh
```

И `/etc/systemd/system/focus-backup.timer`:
```ini
[Unit]
Description=Daily Focus Database Backup

[Timer]
OnCalendar=daily
OnCalendar=02:00

[Install]
WantedBy=timers.target
```

Затем:
```bash
sudo systemctl enable focus-backup.timer
sudo systemctl start focus-backup.timer
```

#### Вариант 3: Задача Windows (Windows Server)
Создайте задачу в Планировщике задач Windows, которая запускает `backup.ps1` ежедневно.

## Альтернативные варианты хранения данных

### Вариант 1: Внешняя БД (рекомендуется для продакшена)

Вместо PostgreSQL в Docker используйте управляемую БД (AWS RDS, DigitalOcean Managed Database, etc.):

1. Создайте внешнюю БД
2. Обновите `APP_DATABASE_URL` в `.env` обоих сервисов
3. Данные будут храниться вне Docker и легко переносятся

### Вариант 2: Bind mount вместо volume

В `docker-compose.yml` замените:
```yaml
volumes:
  - focus-db-data:/var/lib/postgresql/data
```

На:
```yaml
volumes:
  - ./database/data:/var/lib/postgresql/data
```

**Плюсы:** данные в файловой системе, легко копировать  
**Минусы:** может быть медленнее, проблемы с правами доступа

### Вариант 3: Регулярные бэкапы в облачное хранилище

Настройте автоматическую загрузку бэкапов в S3, Google Cloud Storage или другой объектный storage:

```bash
# Пример для AWS S3
./backup.sh
aws s3 cp database/backups/focus_db_backup_*.sql.gz s3://your-bucket/backups/
```

## Чеклист перед переездом

- [ ] Создан бэкап базы данных
- [ ] Бэкап скопирован на новый сервер или в облачное хранилище
- [ ] Проверен размер бэкапа (убедитесь что он не пустой)
- [ ] На новом сервере развёрнут проект
- [ ] Данные восстановлены из бэкапа
- [ ] Проверена работоспособность (логин, доступ к Focus Kids)
- [ ] Настроены автоматические бэкапы на новом сервере

## Восстановление после потери данных

Если данные потеряны и нет бэкапа:

1. **Проверьте Docker volumes:**
   ```bash
   docker volume ls
   docker volume inspect focus-db-data
   ```

2. **Попробуйте восстановить из volume напрямую** (если контейнер ещё существует)

3. **Если ничего не помогло** — данные утеряны. Нужно начинать с нуля.

**Вывод:** всегда делайте регулярные бэкапы!
