# Размещение проекта на GitHub (тестовый хостинг)

## 1. Создание репозитория на GitHub

1. Войдите на [GitHub](https://github.com).
2. **New repository** (или «+» → New repository).
3. Укажите имя (например, `focus-telegram-miniapp`), видимость (Private/Public).
4. **Не** ставьте галочки «Add a README», «Add .gitignore» — у вас уже есть код.
5. Нажмите **Create repository**.

## 2. Подключение локального репозитория к GitHub

В корне проекта:

```bash
# Если Git ещё не инициализирован
git init

# Добавить GitHub как remote (замените на свой URL)
git remote add origin https://github.com/WeIbSchatten/focus-telegram-miniapp.git

# Или по SSH
git remote add origin git@github.com:ВАШ_USERNAME/focus-telegram-miniapp.git
```

Если remote `origin` уже есть, замените URL:

```bash
git remote set-url origin https://github.com/WeIbSchatten/focus-telegram-miniapp.git
```

## 3. Первый пуш в GitHub

```bash
git add .
git status   # проверьте, что нет лишнего (.env и т.п. в .gitignore)
git commit -m "Initial commit: Focus Telegram Mini App"
git branch -M main
git push -u origin main
```

- **HTTPS:** при запросе пароля используйте [Personal Access Token](https://github.com/settings/tokens) (scope `repo`) вместо пароля.
- **SSH:** ключ должен быть добавлен в GitHub (Settings → SSH and GPG keys).

## 4. CI (GitHub Actions)

В проекте настроен пайплайн `.github/workflows/ci.yml` — при push и pull request в ветки `main` или `master` запускаются:

- **Frontend** — установка зависимостей, lint, сборка Next.js
- **Focus Service** — установка зависимостей, сборка NestJS
- **Focus Kids Service** — установка Python-зависимостей
- **Telegram Bot** — установка зависимостей, сборка TypeScript
- **Docker build** — проверка сборки всех Docker-образов (после успешной сборки остальных)

Секреты и переменные для деплоя задавайте в Settings → Secrets and variables → Actions.

## 5. Что не попадает в репозиторий (уже в .gitignore)

- Файлы `.env`, `.env.local` и секреты — **не коммитьте**.
- Переменные окружения для CI/деплоя задавайте в GitHub (Settings → Secrets and variables → Actions).

## 6. Деплой (тестовый)

Для «просто захостить» проекта можно:

- **GitHub Pages** — подходит только для статики (например, только фронт на Next.js export). Для полноценного Next.js + API нужен сервер или PaaS.
- **Сервер / VPS** — клонировать репозиторий на сервер, настроить `docker-compose` и переменные окружения, запустить сервисы.
- **PaaS** (Render, Railway, Fly.io и т.п.) — подключить репозиторий GitHub через импорт, настроить сервисы и переменные.

После пуша код хранится в GitHub; деплой настраивается отдельно под выбранный способ хостинга.
