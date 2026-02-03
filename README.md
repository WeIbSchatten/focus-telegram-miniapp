## Focus – Telegram Mini App платформа

**Быстрый старт:** настрой файлы окружения (раздел [«Что нужно изменить для запуска»](#что-нужно-изменить-для-запуска)), выполни `docker-compose up -d` и открой [http://localhost:3000](http://localhost:3000). Всё работает одним стеком в Docker. Подробнее — [«Как запустить проект»](#как-запустить-проект).

---

**Focus** – это платформа в экосистеме Telegram Mini Apps для оффлайн школы английского языка, которая выносит часть учебного процесса в онлайн и позволяет в будущем подключать новые сервисы бизнеса.

- **Focus (hub)** – основной сервис‑хаб, через который:
  - пользователи проходят регистрацию;
  - модераторы одобряют заявки и выдают доступ к дочерним сервисам;
  - в текущем релизе – доступ к сервисам **Focus Kids** и **Focus Sense**.
- **Focus Kids** – сервис онлайн‑обучения детей английскому языку:
  - управление учениками, учителями и группами;
  - учёт посещаемости оффлайн‑занятий;
  - система оценок и статистики;
  - конструктор программы обучения (лекции, ДЗ, тесты);
  - загрузка и проверка домашних заданий;
  - система тестов с авто‑проверкой и возможностью перепрохождения по решению учителя.
- **Focus Sense** – сервис медитации и личностного роста:
  - аудиомедитации и аффирмации на ходу (mp3/m4a, до 5 МБ);
  - установка на неделю (одна случайная установка на главной, обновляется в понедельник в 00:00);
  - вопрос дня (один случайный вопрос на главной, обновляется каждый день в 00:00);
  - доступ имеют все зарегистрированные пользователи платформы Focus.

Платформа спроектирована как **SOA** с отдельными сервисами:

- сервис **Focus** (NestJS) – аутентификация, регистрация, модерация, доступ к сервисам;
- сервис **Focus Kids** (FastAPI) – доменная логика школы английского;
- сервис **Focus Sense** (FastAPI) – медитации, аффирмации, установка на неделю, вопрос дня;
- **Telegram Bot** (Node.js, Telegraf) – минимальный бот: кнопка меню и /start для открытия Mini App;
- **Frontend** (Next.js, Telegram Mini App) – единый интерфейс для Focus, Focus Kids и Focus Sense.

Роли в системе:

- **Admin** – полный доступ для разработки и администрирования;
- **Moderator** – модерация пользователей и выдача доступа к сервисам;
- **Teacher** – управление учебными материалами, выставление оценок, проверка работ;
- **Student** – просмотр и выполнение заданий, прохождение тестов;
- **User** – зарегистрированный пользователь, подавший заявку на доступ к сервисам.

Дальнейшее развитие платформы предполагает добавление новых сервисов без изменения ядра Focus.

## Что нужно изменить для запуска

Перед первым запуском задайте в конфигурации:

| Где | Что менять | Описание |
|-----|------------|----------|
| **Корень** `.env` или **backend/focus-service/.env** | `TELEGRAM_BOT_TOKEN` | Токен бота от [@BotFather](https://t.me/BotFather). Один и тот же для focus-service и telegram-bot. |
| **Корень** `.env` | `INTERNAL_API_SECRET`, `TELEGRAM_BOT_NOTIFY_SECRET` | Произвольные длинные секреты. Тот же `INTERNAL_API_SECRET` — в focus-service и в telegram-bot; тот же `TELEGRAM_BOT_NOTIFY_SECRET` — в focus-kids-service и в telegram-bot как `NOTIFY_SECRET`. |
| **backend/telegram-bot/.env** | `MINI_APP_URL` | Публичный HTTPS-адрес фронта (туннель или домен). Пример: `https://09e52bf30fd6d5.lhr.life`. При смене туннеля — обновить здесь и в корневом `.env` (`TUNNEL_OR_FRONTEND_URL`, `CORS_ORIGINS_EXTRA`). |
| **backend/focus-kids-service/.env** | `TELEGRAM_BOT_NOTIFY_URL`, `TELEGRAM_BOT_NOTIFY_SECRET`, `CORS_ORIGINS_EXTRA` | `TELEGRAM_BOT_NOTIFY_URL=http://focus-telegram-bot:4000`. Секрет — тот же, что `NOTIFY_SECRET` в боте. `CORS_ORIGINS_EXTRA` — URL туннеля (HTTPS) для Mini App. |
| **backend/focus-sense-service/.env** | `APP_JWT_SECRET`, `CORS_ORIGINS_EXTRA` | `APP_JWT_SECRET` — тот же, что в focus-service. `CORS_ORIGINS_EXTRA` — URL туннеля (HTTPS) для Mini App. |
| **backend/focus-service/.env** | `INTERNAL_API_SECRET` | Тот же, что в telegram-bot (для внутреннего API telegram-ids). |
| **frontend/.env.local** | `NEXT_PUBLIC_TELEGRAM_BOT_NAME` | Username бота без @ (например `focus_vn_bot`). Оставь `NEXT_PUBLIC_FOCUS_API_URL`, `NEXT_PUBLIC_KIDS_API_URL` и `NEXT_PUBLIC_SENSE_API_URL` пустыми (запросы идут через прокси). |

Остальные переменные из `.env.example` можно оставить по умолчанию.

## Как запустить проект

Всё запускается **одним стеком в Docker**: база, Focus, Focus Kids, фронтенд и бот.

1. **Создай файлы окружения** (если ещё нет):
   - В **корне**: `cp .env.example .env` и при необходимости измени переменные из таблицы [выше](#что-нужно-изменить-для-запуска).
   - В **backend/focus-service**: создай `.env` с `APP_DATABASE_URL=postgres://focus:focus_password@focus-db:5432/focus_db`, `APP_JWT_SECRET=change_me_focus_jwt`, `TELEGRAM_BOT_TOKEN=<токен>`, `INTERNAL_API_SECRET` (тот же, что в корне).
   - В **backend/focus-kids-service**: создай `.env` с `APP_DATABASE_URL`, `APP_JWT_SECRET`, `FOCUS_SERVICE_URL=http://focus-service:3000`, `TELEGRAM_BOT_NOTIFY_URL=http://focus-telegram-bot:4000`, `TELEGRAM_BOT_NOTIFY_SECRET`, `CORS_ORIGINS_EXTRA` (URL туннеля, см. ниже).
   - В **backend/telegram-bot**: `cp .env.example .env`, укажи `TELEGRAM_BOT_TOKEN`, `MINI_APP_URL` (URL туннеля после его запуска), `NOTIFY_SECRET`, `FOCUS_SERVICE_URL=http://focus-service:3000`, `INTERNAL_API_SECRET`.
   - В **backend/focus-sense-service**: создай `.env` с `APP_DATABASE_URL=postgres://focus:focus_password@focus-db:5432/focus_db`, `APP_JWT_SECRET` (тот же, что в focus-service), `CORS_ORIGINS_EXTRA` (URL туннеля при Mini App).
   - В **frontend**: `cp .env.local.example .env.local`. Оставь `NEXT_PUBLIC_FOCUS_API_URL=`, `NEXT_PUBLIC_KIDS_API_URL=` и `NEXT_PUBLIC_SENSE_API_URL=` пустыми. Укажи `NEXT_PUBLIC_TELEGRAM_BOT_NAME`.

2. **Запусти стек:**
   ```bash
   docker-compose up -d
   ```

3. **Проверь контейнеры:**
   ```bash
   docker-compose ps
   ```
   Должны быть: focus-db, focus-service, focus-kids-service, focus-sense-service, focus-frontend, focus-telegram-bot.

4. **Сайт в браузере:**
   - Главная: [http://localhost:3000](http://localhost:3000)
   - Регистрация: [http://localhost:3000/auth/register](http://localhost:3000/auth/register)
   - После входа — Focus Kids: [http://localhost:3000/kids](http://localhost:3000/kids), Focus Sense: [http://localhost:3000/sense](http://localhost:3000/sense)

5. **Mini App в Telegram** — нужен публичный HTTPS-адрес фронта. Разверни туннель (см. [Туннель для Mini App](#туннель-для-mini-app)), подставь полученный URL в `MINI_APP_URL` (бот) и в `CORS_ORIGINS_EXTRA` (focus-kids-service), перезапусти контейнеры (`docker-compose up -d`). Затем открой бота в Telegram и нажми «Открыть Focus».

6. **Остановка:**
   ```bash
   docker-compose down
   ```

### Туннель для Mini App

Чтобы открывать приложение из Telegram, фронт должен быть доступен по HTTPS с интернета. Используй туннель через SSH (localhost.run):

1. Убедись, что стек запущен и фронт доступен локально: [http://localhost:3000](http://localhost:3000).
2. В отдельном терминале выполни:
   ```bash
   ssh -R 80:localhost:3000 nokey@localhost.run
   ```
   На Windows нужен SSH-клиент (например, встроенный: «Параметры → Приложения → Опциональные возможности → OpenSSH-клиент»).
3. В выводе команды появится строка вида `https://xxxxxx.lhr.life` — это публичный URL фронта.
4. Подставь этот URL в конфигурацию:
   - **backend/telegram-bot/.env**: `MINI_APP_URL=https://xxxxxx.lhr.life`
   - **backend/focus-kids-service/.env**: `CORS_ORIGINS_EXTRA=https://xxxxxx.lhr.life`
   - **backend/focus-sense-service/.env**: `CORS_ORIGINS_EXTRA=https://xxxxxx.lhr.life`
   - В корневом **.env** (если используешь): `TUNNEL_OR_FRONTEND_URL=https://xxxxxx.lhr.life`, `CORS_ORIGINS_EXTRA=https://xxxxxx.lhr.life`
5. Перезапусти сервисы, чтобы подхватить новые переменные:
   ```bash
   docker-compose up -d
   ```
6. Открой бота в Telegram и нажми кнопку меню или «Открыть Focus» — откроется Mini App по этому URL.

Туннель должен оставаться запущенным, пока нужен доступ к Mini App из Telegram. При каждом новом запуске `ssh ... localhost.run` URL может меняться — тогда обнови `MINI_APP_URL` и `CORS_ORIGINS_EXTRA` и снова перезапусти контейнеры.

---

## База данных

**Все данные хранятся в БД (PostgreSQL).** Таблицы создавать вручную не нужно.

- В **Docker** поднимается один PostgreSQL (`focus-db`). База `focus_db` создаётся из переменных окружения.
- **Focus** (NestJS): таблица `users` (пользователи, роли, привязка Telegram, доступ к Kids).
- **Focus Kids** (FastAPI): таблицы `students`, `teachers`, `groups`, `programs`, `lectures`, `homeworks`, `tests`, `attendance`, `grades` и т.д.
- **Focus Sense** (FastAPI): таблицы `sense_meditations`, `sense_affirmations`, `sense_weekly_intentions`, `sense_daily_questions` — аудио и текстовый контент для медитаций и личностного роста.

Список пользователей приходит из Focus (users), списки учеников/преподавателей/групп/занятий — из Focus Kids (БД). При открытии фронта через туннель (Mini App) запросы идут через прокси Next.js; в Docker прокси ведёт на внутренние сервисы `focus-service` и `focus-kids-service`.

Таблицы создаются при первом обращении к БД после `docker-compose up -d`. Подробнее: [database/README.md](database/README.md).

## Интеграция с Telegram (Mini App + бот)

Чтобы открывать Mini App из Telegram, нужен бот с тем же токеном, что и у focus-service (для валидации initData).

1. **Создай бота в Telegram**
   - Открой [@BotFather](https://t.me/BotFather), отправь `/newbot`.
   - Укажи имя и username бота (например, `Focus App` и `focus_app_bot`).
   - Сохрани выданный **токен** (например, `123456:ABC-DEF...`).

2. **Настрой переменные окружения**
   - В корне и в `backend/focus-service/.env` добавь `TELEGRAM_BOT_TOKEN=<токен>` (focus-service использует его для проверки данных от Mini App).
   - В `backend/telegram-bot/.env`: `TELEGRAM_BOT_TOKEN` (тот же), `MINI_APP_URL` (HTTPS-URL фронта после запуска туннеля, см. [Туннель для Mini App](#туннель-для-mini-app)).

3. **Запуск**
   - Бот запускается вместе со стеком: `docker-compose up -d`.

После запуска бот выставит кнопку меню «Открыть Focus» рядом с полем ввода и по команде `/start` покажет кнопку открытия приложения.

**Хранение данных:** группы, программы обучения, посещаемость, оценки и т.п. хранятся в БД (PostgreSQL). Доступ к ним — по JWT с любого устройства (ПК, Mini App в Telegram): фронт отправляет токен в заголовке, Focus Kids проверяет роль (учитель/ученик) по записям в БД и отдаёт данные из БД.

**Привязка Telegram к аккаунту:** на сайте — в личном кабинете (Focus Kids → Профиль): блок «Telegram» и кнопка «Привязать Telegram» (доступна при открытии из бота). В боте — при первом входе «Войти через Telegram» можно ввести email/пароль и привязать аккаунт; дальше вход из бота будет автоматическим.

**Уведомления в Telegram:** бот принимает от Focus Kids запросы на отправку уведомлений ученикам (новое ДЗ, оценки за занятия, новые тесты и видео). Нужно задать один и тот же секрет в боте (`NOTIFY_SECRET`) и в Focus Kids (`TELEGRAM_BOT_NOTIFY_SECRET`), а также `INTERNAL_API_SECRET` в focus-service и в боте (для получения telegram_user_id по focus_user_id). В корневом `.env` задай `INTERNAL_API_SECRET`, `TELEGRAM_BOT_NOTIFY_SECRET`; в `backend/telegram-bot/.env` — `NOTIFY_SECRET`, `FOCUS_SERVICE_URL`, `INTERNAL_API_SECRET`. Ученики получат уведомления только после того, как один раз откроют Mini App из бота (привязка аккаунта к Telegram). Подробнее: [backend/telegram-bot/README.md](backend/telegram-bot/README.md).
