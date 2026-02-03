#!/bin/bash
# Создание всех .env и .env.local с вашими ключами.
# Запуск на сервере: cd /opt/focus-telegram-miniapp && bash docs/create-env-files.sh
# Перед запуском замените ТОКЕН_ОТ_BOTFATHER и имя_бота на свои (или отредактируйте файлы после).

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Ключи (подставлены по вашему запросу)
POSTGRES_PASSWORD='270d119369bfa22cca23f4613154c4e6201b17d45ab032ad34a65a0ccb633329'
INTERNAL_API_SECRET='27d70ccf82b31c20c4ca91d2ccd87acb1e8c29a3951d757b494e54556fd99478'
TELEGRAM_BOT_NOTIFY_SECRET='b87252c13c94bd1ddd0f8aa52459ff16df809eb3ce5f3c6358f321295233eb71'
APP_JWT_SECRET="$INTERNAL_API_SECRET"

# Плейсхолдеры — замените на свои значения
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-8375618909:AAG8eL4p_NimneWw8vNcNHZGbCpWTMGMtUc}"
BOT_NAME="${NEXT_PUBLIC_TELEGRAM_BOT_NAME:-focus_vn_bot}"

mkdir -p backend/focus-service backend/focus-kids-service backend/focus-sense-service backend/telegram-bot frontend

# 1. Корневой .env
cat > .env << EOF
POSTGRES_USER=focus
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=focus_db
POSTGRES_PORT=5432

INTERNAL_API_SECRET=$INTERNAL_API_SECRET
TELEGRAM_BOT_NOTIFY_SECRET=$TELEGRAM_BOT_NOTIFY_SECRET
CORS_ORIGINS_EXTRA=https://focusvn.mooo.com
EOF
echo "Created $ROOT/.env"

# 2. backend/focus-service/.env
cat > backend/focus-service/.env << EOF
APP_DATABASE_URL=postgresql://focus:$POSTGRES_PASSWORD@focus-db:5432/focus_db
APP_JWT_SECRET=$APP_JWT_SECRET
APP_PORT=3000
TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
INTERNAL_API_SECRET=$INTERNAL_API_SECRET
EOF
echo "Created $ROOT/backend/focus-service/.env"

# 3. backend/focus-kids-service/.env
cat > backend/focus-kids-service/.env << EOF
APP_DATABASE_URL=postgresql://focus:$POSTGRES_PASSWORD@focus-db:5432/focus_db
APP_JWT_SECRET=$APP_JWT_SECRET
FOCUS_SERVICE_URL=http://focus-service:3000
TELEGRAM_BOT_NOTIFY_URL=http://focus-telegram-bot:4000
TELEGRAM_BOT_NOTIFY_SECRET=$TELEGRAM_BOT_NOTIFY_SECRET
INTERNAL_API_SECRET=$INTERNAL_API_SECRET
CORS_ORIGINS_EXTRA=https://focusvn.mooo.com
EOF
echo "Created $ROOT/backend/focus-kids-service/.env"

# 4. backend/focus-sense-service/.env
cat > backend/focus-sense-service/.env << EOF
APP_DATABASE_URL=postgresql://focus:$POSTGRES_PASSWORD@focus-db:5432/focus_db
APP_JWT_SECRET=$APP_JWT_SECRET
FOCUS_SERVICE_URL=http://focus-service:3000
CORS_ORIGINS_EXTRA=https://focusvn.mooo.com
EOF
echo "Created $ROOT/backend/focus-sense-service/.env"

# 5. backend/telegram-bot/.env
cat > backend/telegram-bot/.env << EOF
TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
MINI_APP_URL=https://focusvn.mooo.com
NOTIFY_SECRET=$TELEGRAM_BOT_NOTIFY_SECRET
FOCUS_SERVICE_URL=http://focus-service:3000
KIDS_API_URL=http://focus-kids-service:8000
INTERNAL_API_SECRET=$INTERNAL_API_SECRET
NOTIFY_PORT=4000
EOF
echo "Created $ROOT/backend/telegram-bot/.env"

# 6. frontend/.env.local
cat > frontend/.env.local << EOF
NEXT_PUBLIC_FOCUS_API_URL=
NEXT_PUBLIC_KIDS_API_URL=
NEXT_PUBLIC_SENSE_API_URL=
NEXT_PUBLIC_TELEGRAM_BOT_NAME=$BOT_NAME
EOF
echo "Created $ROOT/frontend/.env.local"

echo ""
echo "Готово. Проверьте и при необходимости замените в файлах:"
echo "  - TELEGRAM_BOT_TOKEN (focus-service и telegram-bot) — токен от @BotFather"
echo "  - NEXT_PUBLIC_TELEGRAM_BOT_NAME (frontend/.env.local) — имя бота в Telegram (без @)"
echo ""
echo "Чтобы подставить токен и имя бота при запуске скрипта:"
echo "  TELEGRAM_BOT_TOKEN=123:ABC NEXT_PUBLIC_TELEGRAM_BOT_NAME=my_bot bash docs/create-env-files.sh"
echo ""
