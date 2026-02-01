-- Скрипт выполняется при первом запуске PostgreSQL в Docker.
-- База focus_db создаётся автоматически из переменной POSTGRES_DB.
-- Таблицы создаются приложением при старте (Focus — TypeORM synchronize, Focus Kids — SQLAlchemy create_all).
-- Этот файл оставлен для совместимости с монтированием /docker-entrypoint-initdb.d.
SELECT 1;
