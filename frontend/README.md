# Focus Frontend

Next.js 14 приложение для платформы Focus и сервиса Focus Kids. Работает в браузере и как Telegram Mini App.

## Требования

- Node.js 18+
- npm или yarn

## Что нужно изменить для запуска

| Переменная | Описание |
|------------|----------|
| `NEXT_PUBLIC_FOCUS_API_URL`, `NEXT_PUBLIC_KIDS_API_URL` | Для **Docker** и при открытии по **туннелю** оставьте **пустыми** — запросы идут через прокси Next.js. Для локального запуска без прокси укажите `http://localhost:3001` и `http://localhost:8001` (нужен CORS на бэкендах). |
| `NEXT_PUBLIC_TELEGRAM_BOT_NAME` | Username бота без @ (например `focus_vn_bot`) — для отображения и Mini App. |

## Установка

```bash
npm install
cp .env.local.example .env.local
```

Заполните переменные из таблицы выше при необходимости.

## Запуск

```bash
# Режим разработки
npm run dev

# Сборка
npm run build

# Продакшен
npm start
```

Приложение будет доступно на http://localhost:3000.

## Telegram Mini App

Откройте приложение через бота в Telegram. Вход через Telegram будет доступен, если пользователь уже зарегистрирован и привязал аккаунт в личном кабинете.

## Цвета и стили

- Основной: #7109AA (фиолетовый)
- Kids-акценты: #FFD300 (жёлтый)
- Фон: #FFFFFF
- Градиенты и тени заданы в `tailwind.config.ts` и `globals.css`.
