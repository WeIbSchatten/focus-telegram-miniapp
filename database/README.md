# База данных Focus

## Что нужно изменить для запуска

Обычно менять ничего не нужно: по умолчанию используется один PostgreSQL в Docker с базой `focus_db`, пользователь и пароль заданы в корневом `.env` (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`). Если меняешь их в корне — задай те же значения в `APP_DATABASE_URL` в **backend/focus-service** и **backend/focus-kids-service** (формат `postgres://USER:PASSWORD@focus-db:5432/DATABASE` для Docker или `@localhost:5432` при локальной БД).

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

4. При первом старте **focus-service** в БД автоматически создаются учётные записи администратора и модератора (если их ещё нет). Данные для входа заданы в сиде сервиса (`UsersService.seedDefaultUsers`).

Подключение к БД из `.env` обоих сервисов:
- `APP_DATABASE_URL=postgres://focus:focus_password@focus-db:5432/focus_db`

## Папка init-scripts

Файлы из `database/init-scripts/` монтируются в `/docker-entrypoint-initdb.d` и выполняются **только при первом создании тома** (когда БД пустая). Сейчас там только служебный скрипт; создание таблиц делают приложения.

Если позже понадобятся миграции или отдельные базы — можно добавить сюда SQL (например, `CREATE DATABASE`, схемы).

### Миграция для таблицы grades (обратная связь по дате занятия)

Если таблица `grades` уже существовала до добавления полей `lesson_date` и расширения `comment`, выполните вручную:

```bash
# В контейнере БД
docker exec -i focus-db psql -U focus -d focus_db < database/init-scripts/02-grades-lesson-date.sql
```

Или через psql:
```sql
ALTER TABLE grades ADD COLUMN IF NOT EXISTS lesson_date DATE;
ALTER TABLE grades ALTER COLUMN comment TYPE VARCHAR(500);
```

Без этой миграции запросы к посещаемости/обратной связи (grades) будут возвращать 500.

### Миграция 06: замена одной роли на массив ролей (users.roles)

При обновлении **focus-service** до версии с несколькими ролями у пользователя выполните:

```bash
docker exec -i focus-db psql -U focus -d focus_db < database/init-scripts/06-user-roles.sql
```

Скрипт добавляет колонку `roles`, переносит данные из `role` и удаляет колонку `role`. Для новой БД (без таблицы users или без колонки role) скрипт безопасен.

### Миграция для тестов (max_attempts)

Если таблица `tests` уже существовала до добавления поля `max_attempts`, выполните вручную:

```bash
# Из корня проекта, контейнер focus-db должен быть запущен
docker exec -i focus-db psql -U focus -d focus_db < database/init-scripts/03-tests-max-attempts.sql
```

Или одной командой (подставьте свои POSTGRES_USER/POSTGRES_DB, если меняли в .env):
```bash
docker exec -i focus-db psql -U focus -d focus_db -c "ALTER TABLE tests ADD COLUMN IF NOT EXISTS max_attempts INTEGER NULL;"
```

### Миграция: привязка занятия и оценок к программе (теме урока)

Чтобы учитель мог выбирать тему (программу) урока и корректно отображалось количество проведённых занятий по программе:

```bash
docker exec -i focus-db psql -U focus -d focus_db < database/init-scripts/04-attendance-grades-program-id.sql
```

Или одной командой:
```bash
docker exec -i focus-db psql -U focus -d focus_db -c "ALTER TABLE attendance ADD COLUMN IF NOT EXISTS program_id INTEGER NULL REFERENCES programs(id); ALTER TABLE grades ADD COLUMN IF NOT EXISTS program_id INTEGER NULL REFERENCES programs(id);"
```

### Миграция: видео по темам (YouTube, VK, RuTube)

Поддержка ссылок на YouTube, VK Video и RuTube для лекций (видео по программе):

```bash
docker exec -i focus-db psql -U focus -d focus_db < database/init-scripts/05-lecture-video-type-id.sql
```

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
