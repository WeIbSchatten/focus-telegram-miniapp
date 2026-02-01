# Размещение проекта на GitLab (тестовый хостинг)

## 1. Создание репозитория на GitLab

1. Войдите в [GitLab](https://gitlab.com) (или ваш self-hosted GitLab).
2. **New project** → **Create blank project**.
3. Укажите имя (например, `focus-telegram-miniapp`), видимость (Private/Public).
4. **Не** включайте инициализацию с README — у вас уже есть код.
5. Нажмите **Create project**.

## 2. Подключение локального репозитория к GitLab

В корне проекта выполните (подставьте свой URL репозитория):

```bash
# Если Git ещё не инициализирован
git init

# Добавить GitLab как remote (замените на ваш URL)
git remote add origin https://gitlab.com/weibschatten1/FucusVN#

# Или по SSH
git remote add origin git@gitlab.com:ВАШ_USERNAME/focus-telegram-miniapp.git
```

Если remote `origin` уже есть (например, с GitHub), переименуйте или замените:

```bash
git remote -v
git remote set-url origin https://gitlab.com/ВАШ_USERNAME/focus-telegram-miniapp.git
# или добавить второй remote:
git remote add gitlab https://gitlab.com/ВАШ_USERNAME/focus-telegram-miniapp.git
```

## 3. Первый пуш в GitLab

```bash
git add .
git status   # проверьте, что нет лишнего (.env и т.п. в .gitignore)
git commit -m "Initial commit: Focus Telegram Mini App"
git branch -M main
git push -u origin main
```

При запросе логина используйте:
- **HTTPS:** логин GitLab + [Personal Access Token](https://gitlab.com/-/user_settings/personal_access_tokens) (scope: `write_repository`) вместо пароля.
- **SSH:** ключ должен быть добавлен в GitLab (Settings → SSH Keys).

## 4. Что не попадает в репозиторий (уже в .gitignore)

- Файлы `.env`, `.env.local` и секреты — **не коммитьте**.
- В GitLab задайте переменные (Settings → CI/CD → Variables) для сборки/деплоя, если будете использовать CI.

## 5. Опционально: CI в GitLab для проверки сборки

В корне проекта можно добавить `.gitlab-ci.yml` — тогда при каждом push GitLab будет запускать пайплайн (например, сборка фронта и бэкендов). Пример минимального файла см. в корне репозитория (если добавлен).

## 6. Деплой (тестовый хостинг)

Для «просто захостить» проекта можно:

- **GitLab Pages** — подходит только для статики (например, только фронт на Next.js export). Для полноценного Next.js + API нужен сервер или PaaS.
- **Сервер / VPS** — клонировать репозиторий на сервер, настроить `docker-compose` и переменные окружения, запустить сервисы.
- **PaaS** (Render, Railway, Fly.io и т.п.) — подключить репозиторий GitLab через импорт, настроить сервисы и переменные.

После пуша код будет храниться в GitLab; деплой настраивается отдельно под выбранный способ хостинга.
