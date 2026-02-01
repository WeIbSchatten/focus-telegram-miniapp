# База данных Focus

## Как устроено

- **Один PostgreSQL** (`focus-db`) поднимается в Docker.
- **Одна база** `focus_db` — в ней работают оба бэкенда: Focus (NestJS) и Focus Kids (FastAPI).
- **Таблицы создавать вручную не нужно.**

### Кто создаёт таблицы

| Сервис        | Как создаёт таблицы |
|---------------|----------------------|
| **Focus** (NestJS)   | При старте приложения TypeORM с `synchronize: true` создаёт/обновляет свои таблицы (например `users`). |
| **Focus Kids** (FastAPI) | При старте приложения вызывается `Base.metadata.create_all(bind=engine)` — создаются все таблицы по моделям (students, groups, programs и т.д.). |

То есть после `docker-compose up` или после запуска обоих бэкендов таблицы появятся сами при первом запросе к БД.

## Запуск с нуля

1. Запустите контейнеры:
   ```bash
   docker-compose up -d
   ```

2. Сначала поднимите **БД** (она создаётся при первом старте `focus-db`).

3. Затем стартуют **focus-service** и **focus-kids-service** — при их запуске и создаются таблицы.

Подключение к БД из `.env` обоих сервисов:
- `APP_DATABASE_URL=postgres://focus:focus_password@focus-db:5432/focus_db`

## Папка init-scripts

Файлы из `database/init-scripts/` монтируются в `/docker-entrypoint-initdb.d` и выполняются **только при первом создании тома** (когда БД пустая). Сейчас там только служебный скрипт; создание таблиц делают приложения.

Если позже понадобятся миграции или отдельные базы — можно добавить сюда SQL (например, `CREATE DATABASE`, схемы).

## Локальный запуск без Docker

1. Установите PostgreSQL и создайте базу:
   ```bash
   createdb -U postgres focus_db
   ```
   или через psql:
   ```sql
   CREATE USER focus WITH PASSWORD 'focus_password';
   CREATE DATABASE focus_db OWNER focus;
   ```

2. В `.env` сервисов укажите URL к локальной БД, например:
   - Focus: `APP_DATABASE_URL=postgres://focus:focus_password@localhost:5432/focus_db`
   - Focus Kids: то же значение.

3. Запустите оба бэкенда — таблицы создадутся при старте так же, как в Docker.

## Бэкапы и миграция данных

⚠️ **Важно:** При переезде на другой хостинг данные из Docker volume **не переносятся автоматически**.

- **Создание бэкапа:** `./backup.sh` (Linux/Mac) или `.\backup.ps1` (Windows)
- **Восстановление:** `./restore.sh <backup-file>` (Linux/Mac)
- **Подробная инструкция:** [MIGRATION.md](MIGRATION.md)

Рекомендуется настроить автоматические ежедневные бэкапы.

## Важно для продакшена

- В Focus отключите `synchronize: true` и используйте миграции TypeORM.
- В Focus Kids замените `create_all` на миграции Alembic.
- Init-скрипты в Docker выполняются только при первом создании тома; для обновления схем используйте миграции в коде.
- **Настройте регулярные бэкапы** и храните их в надёжном месте (облачное хранилище).
