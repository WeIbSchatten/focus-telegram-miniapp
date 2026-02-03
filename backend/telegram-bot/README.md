# Focus Telegram Bot

Бот для привязки Mini App к Telegram и отправки уведомлений ученикам: новое ДЗ, оценки за занятия, новые тесты и видео.

## Назначение

- **Кнопка меню** (рядом с полем ввода в чате с ботом) — открывает Mini App по URL из `MINI_APP_URL`.
- **Команда `/start`** — приветствие с описанием Focus Kids и Focus Sense, кнопки «Focus Kids», «Focus Sense» и «Открыть главную».
- **Команда `/app`** — кнопки открытия Kids, Sense или главной страницы.
- **Команда `/kids`** — быстрая кнопка открытия Focus Kids.
- **Команда `/sense`** — быстрая кнопка открытия Focus Sense.
- **Команда `/help`** — справка по всем командам.
- **Команда `/status`** — статус ученика в Focus Kids: есть ли новое ДЗ и непройденные тесты (требует привязанный Telegram и роль ученика).
- **Уведомления** — Focus Kids вызывает `POST /notify`; бот получает `telegram_user_id` из Focus service и отправляет сообщения о новом ДЗ, оценках, тестах и видео (с форматированием HTML).

Токен бота должен совпадать с `TELEGRAM_BOT_TOKEN` в focus-service (проверка `initData` от Mini App).

## Что нужно изменить для запуска

| Переменная | Описание |
|------------|----------|
| `TELEGRAM_BOT_TOKEN` | Токен от [@BotFather](https://t.me/BotFather). Тот же, что в focus-service. |
| `MINI_APP_URL` | Публичный **HTTPS**-URL фронта (туннель или домен). При смене туннеля обновить здесь и в корневом `.env` (CORS в Kids). |
| `NOTIFY_SECRET` | Произвольный длинный секрет; тот же задать в Focus Kids как `TELEGRAM_BOT_NOTIFY_SECRET`. |
| `INTERNAL_API_SECRET` | Тот же, что в focus-service (для запроса telegram_user_id по focus_user_id). |
| `FOCUS_SERVICE_URL` | В Docker: `http://focus-service:3000`. Локально: `http://localhost:3001`. |
| `KIDS_API_URL` | URL Focus Kids API для команды `/status`. В Docker: `http://focus-kids-service:8000`. Локально: `http://localhost:8000`. |
| `NOTIFY_PORT` | Порт HTTP-сервера уведомлений (по умолчанию 4000). |

## Настройка

1. Создай бота в [@BotFather](https://t.me/BotFather): `/newbot` → имя и username (например `@focus_vn_bot`) → сохрани токен.
2. Скопируй `.env.example` в `.env`:
   ```bash
   cp .env.example .env
   ```
3. Заполни переменные из таблицы выше. Для `MINI_APP_URL`: туннель на порт 3000 (например `npx localtunnel --port 3000`, [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) или другой HTTPS-URL фронта).

## Запуск

```bash
npm install
npm run dev    # разработка (ts-node)
# или
npm run build && npm start
```

В Docker бот запускается вместе с остальными сервисами (`docker-compose up -d`). Файл окружения: `backend/telegram-bot/.env`.

## Привязка Mini App к боту в BotFather (опционально)

Кнопку меню бот выставляет сам через API (`setChatMenuButton`). Дополнительно в BotFather можно указать описание и команды:

- **Bot Settings → Edit Bot Description** — краткое описание.
- **Bot Settings → Edit Commands** — бот сам выставляет команды при запуске (`setMyCommands`): `/start`, `/app`, `/kids`, `/sense`, `/help`.

После настройки пользователи открывают бота, нажимают кнопку меню или «Открыть Focus» в сообщении после `/start` и попадают в Mini App.

## Устранение неполадок

**localtunnel: «connection refused» (check your firewall settings)**  
Исходящее подключение к localtunnel.me блокируется файрволом, антивирусом или сетью. Варианты: разрешить исходящие соединения для Node/npx; попробовать другую сеть (например, мобильный интернет); использовать другой туннель — **localhost.run** (SSH, порт 22): `ssh -R 80:localhost:3000 nokey@localhost.run` — в выводе будет HTTPS-URL; или **Cloudflare Tunnel**: `cloudflared tunnel --url http://localhost:3000 --protocol http2`.

**Mini App показывает «Click to continue» или бесконечную загрузку (localtunnel)**  
При первом заходе localtunnel может показать промежуточную страницу. Откройте тот же `MINI_APP_URL` в обычном браузере телефона, нажмите «Click to continue» / «Продолжить», затем снова откройте Mini App из Telegram.

**PowerShell: «running scripts is disabled» при запуске npx**  
Запускайте `npx localtunnel --port 3000` из **cmd** (командная строка Windows) или один раз выполните в PowerShell: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`.

**Кнопка Mini App / MINI_APP_URL**  
- `MINI_APP_URL` должен быть **HTTPS** (например, `https://your-app.vercel.app` или `https://xxx.loca.lt`). HTTP не подойдёт.
- Альтернативы localtunnel: **localhost.run** — `ssh -R 80:localhost:3000 nokey@localhost.run`; [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) — `cloudflared tunnel --url http://localhost:3000 --protocol http2` (на Windows без `--protocol http2` возможны таймауты).

**Бот не отвечает на /start**
- Проверь логи контейнера: `docker logs focus-telegram-bot`. Должно быть `Bot connected: @твой_бот` и `Focus Telegram bot is running`.
- Если был настроен вебхук на этот бот — бот при старте удалит его и перейдёт на long polling. Перезапусти контейнер.
- Убедись, что `TELEGRAM_BOT_TOKEN` в `.env` совпадает с токеном от BotFather (без пробелов и кавычек).

**Кнопка Mini App не отображается**
- Кнопка меню показывается **в личном чате с ботом** — рядом с полем ввода (иконка меню или текст «Открыть Focus»). Открой чат с ботом и посмотри рядом с полем ввода.
- `MINI_APP_URL` должен быть **HTTPS** (например, `https://your-app.vercel.app` или `https://xxx.loca.lt`). HTTP не подойдёт.
- В логах должно быть `Menu button set to: <url>`. Если видишь `MINI_APP_URL must be HTTPS` — поменяй URL на HTTPS.
- В некоторых клиентах кнопка обновляется не сразу — перезапусти приложение Telegram или открой бота заново.

## Уведомления (Focus Kids → бот)

Focus Kids при создании ДЗ, лекции (видео), теста или при выставлении оценки вызывает:

```http
POST /notify
X-Notify-Secret: <NOTIFY_SECRET>
Content-Type: application/json

{
  "focus_user_ids": ["uuid1", "uuid2"],
  "type": "new_homework" | "new_grade" | "new_test" | "new_video",
  "payload": { "program_name": "...", "homework_title": "..." }  // зависит от type
}
```

Бот запрашивает у Focus service `GET /api/internal/telegram-ids?ids=uuid1,uuid2` (с заголовком `X-Internal-Secret`) и отправляет каждому пользователю с привязанным Telegram сообщение. Ученики должны один раз открыть Mini App из бота, чтобы привязать аккаунт к Telegram.
