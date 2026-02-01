# Развёртывание Focus на VPS Timeweb

Пошаговая инструкция: аренда сервера, установка Docker, клонирование репозитория и запуск проекта.

---

## Деплой для focusvn.mooo.com (ваш сервер)

**Сервер:** IP `85.193.80.145`, SSH: `ssh root@85.193.80.145`  
**Домен фронта и Mini App:** `https://focusvn.mooo.com`

Ниже в шагах 5 и 9 везде подставлен этот домен. Бот в Telegram настраивается так, чтобы открывать фронт по ссылке **https://focusvn.mooo.com** (раздел «Настройка бота в Telegram»).

---

## 1. Аренда VPS на Timeweb

1. Зайдите на [timeweb.com](https://timeweb.com) и авторизуйтесь.
2. **Облачный сервер** → **Создать сервер** (или **VPS** в разделе хостинга).
3. Рекомендуемый тариф для проекта:
   - **ОС:** Ubuntu 22.04 LTS
   - **Конфигурация:** минимум 2 GB RAM, 2 ядра, 10–20 GB SSD (например, тариф «Облачный 2» или аналог).
4. Выберите регион (Москва или ближайший).
5. Укажите SSH-ключ или пароль для root. **SSH-ключ предпочтительнее** — добавьте свой публичный ключ.
6. Создайте сервер и дождитесь готовности. Запишите **IP-адрес** сервера.

---

## 2. Подключение по SSH

С вашего компьютера:

```bash
ssh root@IP_АДРЕС_СЕРВЕРА
```

(или `ssh ubuntu@IP` — если создали пользователя ubuntu). При первом подключении подтвердите отпечаток хоста (yes).

---

## 3. Установка Docker и Docker Compose

На сервере выполните:

```bash
# Обновление пакетов
apt update && apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker root

# Установка Docker Compose (плагин)
apt install -y docker-compose-plugin

# Проверка
docker --version
docker compose version
```

Переподключитесь по SSH (`exit` и снова `ssh root@IP`), чтобы группа `docker` применилась.

---

## 4. Клонирование репозитория с GitHub

```bash
# Установка git, если нет
apt install -y git

# Клонирование (подставьте свой репозиторий)
cd /opt
git clone https://github.com/ВАШ_USERNAME/focus-telegram-miniapp.git
cd focus-telegram-miniapp
```

Если репозиторий приватный: настройте [Deploy Key](https://docs.github.com/en/developers/overview/managing-deploy-keys) или используйте Personal Access Token в URL:  
`https://TOKEN@github.com/USERNAME/focus-telegram-miniapp.git`.

---

## 5. Настройка переменных окружения

На сервере нужно создать файлы `.env` для каждого сервиса. Ниже — минимальный набор; секреты замените на свои.

**5.1. Корневой `.env` (для docker-compose)**  
Создайте файл `/opt/focus-telegram-miniapp/.env`:

```env
POSTGRES_USER=focus
POSTGRES_PASSWORD=СЛОЖНЫЙ_ПАРОЛЬ_БД
POSTGRES_DB=focus_db
POSTGRES_PORT=5432

INTERNAL_API_SECRET=длинный_случайный_секрет_для_внутреннего_API
TELEGRAM_BOT_NOTIFY_SECRET=длинный_секрет_для_уведомлений_бота
CORS_ORIGINS_EXTRA=https://focusvn.mooo.com
```

Замените:
- `СЛОЖНЫЙ_ПАРОЛЬ_БД` — пароль PostgreSQL.
- `длинный_случайный_секрет_...` — случайные строки (например, `openssl rand -hex 32`).
- Для домена **focusvn.mooo.com** оставьте `CORS_ORIGINS_EXTRA=https://focusvn.mooo.com`.

**5.2. backend/focus-service/.env**

```env
APP_DATABASE_URL=postgresql://focus:СЛОЖНЫЙ_ПАРОЛЬ_БД@focus-db:5432/focus_db
APP_JWT_SECRET=длинный_секрет_для_JWT
APP_PORT=3000
TELEGRAM_BOT_TOKEN=ТОКЕН_ОТ_BOTFATHER
INTERNAL_API_SECRET=тот_же_что_в_корневом_.env
```

**5.3. backend/focus-kids-service/.env**

```env
APP_DATABASE_URL=postgresql://focus:СЛОЖНЫЙ_ПАРОЛЬ_БД@focus-db:5432/focus_db
APP_JWT_SECRET=тот_же_APP_JWT_SECRET_что_в_focus-service
FOCUS_SERVICE_URL=http://focus-service:3000
TELEGRAM_BOT_NOTIFY_URL=http://focus-telegram-bot:4000
TELEGRAM_BOT_NOTIFY_SECRET=тот_же_что_TELEGRAM_BOT_NOTIFY_SECRET_в_корне
CORS_ORIGINS_EXTRA=https://focusvn.mooo.com
```

**5.4. backend/telegram-bot/.env**

```env
TELEGRAM_BOT_TOKEN=ТОКЕН_ОТ_BOTFATHER
MINI_APP_URL=https://focusvn.mooo.com
NOTIFY_SECRET=тот_же_что_TELEGRAM_BOT_NOTIFY_SECRET_в_корне
FOCUS_SERVICE_URL=http://focus-service:3000
INTERNAL_API_SECRET=тот_же_что_в_корневом_.env
NOTIFY_PORT=4000
```

**5.5. frontend/.env.local**

```env
NEXT_PUBLIC_FOCUS_API_URL=
NEXT_PUBLIC_KIDS_API_URL=
NEXT_PUBLIC_TELEGRAM_BOT_NAME=имя_вашего_бота_в_telegram
```

(Пустые URL — запросы идут через прокси Next.js к контейнерам. Укажите имя бота в Telegram, например `focus_vn_bot`.)

Создать файлы можно так (подставьте свои значения):

```bash
cd /opt/focus-telegram-miniapp
mkdir -p backend/focus-service backend/focus-kids-service backend/telegram-bot frontend
nano backend/focus-service/.env
nano backend/focus-kids-service/.env
nano backend/telegram-bot/.env
nano frontend/.env.local
```

---

## 6. Запуск проекта

```bash
cd /opt/focus-telegram-miniapp
docker compose up -d --build
```

Первый запуск может занять несколько минут (сборка образов). Проверка контейнеров:

```bash
docker compose ps
```

Все сервисы должны быть в состоянии `running`.

---

## 7. DNS: привязка домена focusvn.mooo.com к серверу

Чтобы открывать сайт по **https://focusvn.mooo.com**, домен должен указывать на IP сервера.

1. Зайдите в панель управления доменом **focusvn.mooo.com** (где он зарегистрирован: mooo.com, Cloudflare, Timeweb и т.п.).
2. Добавьте **A-запись**:
   - **Имя/хост:** `@` или `focusvn` (в зависимости от панели; для focusvn.mooo.com часто достаточно `@` или оставить пустым).
   - **Значение/IP:** `85.193.80.145`
   - **TTL:** 300–3600 (по умолчанию).
3. Сохраните и подождите 5–30 минут, пока DNS обновится. Проверка: `ping focusvn.mooo.com` — должен отвечать `85.193.80.145`.

---

## 8. Nginx и HTTPS (обязательно для бота и Mini App)

Telegram открывает Mini App только по **HTTPS**. Нужны порты 80 и 443, Nginx и сертификат Let's Encrypt.

На сервере (после того как DNS уже указывает на 85.193.80.145):

```bash
apt install -y nginx certbot python3-certbot-nginx
```

Создайте конфиг Nginx для проксирования на фронтенд:

```bash
cat > /etc/nginx/sites-available/focusvn << 'EOF'
server {
    listen 80;
    server_name focusvn.mooo.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
ln -sf /etc/nginx/sites-available/focusvn /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

Получите сертификат HTTPS:

```bash
certbot --nginx -d focusvn.mooo.com
```

Следуйте подсказкам (email, согласие с условиями). Certbot сам настроит HTTPS в Nginx.

После этого сайт будет доступен по **https://focusvn.mooo.com** (порт 3000 снаружи не нужен — всё идёт через 80/443).

---

## 9. Файрвол

Откройте только нужные порты:

```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP (редирект на HTTPS)
ufw allow 443/tcp  # HTTPS
ufw enable
ufw status
```

Порты 3000, 3001, 8001, 4000 снаружи не открывайте — к ним обращается только Nginx и контейнеры между собой.

---

## 10. Настройка бота в Telegram (подключение к фронту)

Чтобы пользователи могли открыть Focus из бота (кнопка меню → Mini App), нужен URL фронтенда.

**Автоматически:** если в `backend/telegram-bot/.env` задан `MINI_APP_URL=https://focusvn.mooo.com`, бот при запуске сам выставит кнопку меню «Открыть Focus» с этим URL (см. шаг 5.4). После `docker compose up -d` достаточно открыть бота и нажать кнопку меню.

**Вручную (по желанию):** можно дополнительно задать URL в BotFather:

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram.
2. Отправьте `/mybots` и выберите вашего бота (тот, чей токен указан в `TELEGRAM_BOT_TOKEN`).
3. **Bot Settings** → **Menu Button** → **Configure menu button**.
4. Введите URL: **`https://focusvn.mooo.com`** (без слэша в конце).
5. Сохраните.

После этого в чате с ботом появится кнопка меню (или кнопка «Open App» / «Открыть»), по нажатию откроется фронтенд по адресу https://focusvn.mooo.com.

**Проверка:** откройте бота в Telegram → нажмите кнопку меню (слева от поля ввода) или отправьте `/start` и нажмите «Открыть Focus» → должна открыться страница Focus в браузере или встроенном WebView.

---

## 11. Открытие Focus в браузере

- **По домену (после шагов 7–8):** **https://focusvn.mooo.com**
- **По IP (до настройки DNS/HTTPS):** `http://85.193.80.145:3000`

Страница Focus (главная, вход, Focus Kids) доступна по **https://focusvn.mooo.com**. Бот ведёт на этот же адрес.

---

## 12. Полезные команды

| Действие | Команда |
|----------|--------|
| Логи всех сервисов | `docker compose logs -f` |
| Логи фронтенда | `docker compose logs -f frontend` |
| Остановить | `docker compose down` |
| Перезапустить после изменений | `cd /opt/focus-telegram-miniapp && git pull && docker compose up -d --build` |

После выполнения шагов 1–8 и настройки бота (шаг 10) Focus доступен по **https://focusvn.mooo.com**, а из Telegram — по кнопке меню бота.
