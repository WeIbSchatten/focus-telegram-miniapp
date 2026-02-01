# Тестирование интеграции между Focus и Focus Kids

## Быстрый старт

### 1. Запуск сервисов

```bash
# В корне проекта
docker-compose up -d

# Или локально:
# Terminal 1 - Focus сервис
cd backend/focus-service
npm install
npm run start:dev

# Terminal 2 - Focus Kids сервис
cd backend/focus-kids-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Автоматическое тестирование

```bash
# Установите зависимости для тестов
pip install httpx

# Запустите тестовый скрипт
python test_integration.py
```

## Ручное тестирование через curl

### Шаг 1: Регистрация пользователя

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "fullName": "Test User"
  }'
```

**Ответ:**
```json
{
  "id": "uuid-here",
  "email": "test@example.com",
  "fullName": "Test User",
  "role": "user",
  "status": "pending",
  "hasKidsAccess": false
}
```

### Шаг 2: Логин

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

**Ответ:**
```json
{
  "accessToken": "jwt-token-here"
}
```

Сохраните токен в переменную:
```bash
TOKEN="your-jwt-token-here"
```

### Шаг 3: Проверка информации о пользователе

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Ответ:**
```json
{
  "id": "uuid-here",
  "email": "test@example.com",
  "fullName": "Test User",
  "role": "user",
  "status": "pending",
  "hasKidsAccess": false
}
```

### Шаг 4: Попытка доступа к Focus Kids (без доступа)

```bash
curl http://localhost:8001/api/students \
  -H "Authorization: Bearer $TOKEN"
```

**Ожидаемый ответ:** `403 Forbidden` с сообщением о запрете доступа.

### Шаг 5: Выдача доступа модератором

Сначала нужно получить токен модератора (создайте модератора через БД или используйте существующего).

```bash
# Выдача доступа
curl -X PATCH http://localhost:3001/api/moderation/users/{USER_ID}/kids-access \
  -H "Authorization: Bearer $MODERATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hasAccess": true
  }'
```

### Шаг 6: Проверка доступа к Focus Kids (с доступом)

```bash
curl http://localhost:8001/api/students \
  -H "Authorization: Bearer $TOKEN"
```

**Ожидаемый ответ:** `200 OK` со списком студентов.

## Тестирование статистики

### Статистика ученика

```bash
curl http://localhost:8001/api/statistics/students/{STUDENT_ID} \
  -H "Authorization: Bearer $TOKEN"
```

### Статистика учителя

```bash
curl http://localhost:8001/api/statistics/teachers/{TEACHER_ID} \
  -H "Authorization: Bearer $TOKEN"
```

### Обзор группы

```bash
curl http://localhost:8001/api/statistics/groups/{GROUP_ID}/overview \
  -H "Authorization: Bearer $TOKEN"
```

## Проверка JWT валидации

### Невалидный токен

```bash
curl http://localhost:8001/api/students \
  -H "Authorization: Bearer invalid-token"
```

**Ожидаемый ответ:** `401 Unauthorized`

### Отсутствие токена

```bash
curl http://localhost:8001/api/students
```

**Ожидаемый ответ:** `403 Forbidden` (HTTPBearer требует токен)

## Устранение неполадок

### Focus Kids не может подключиться к Focus сервису

1. Проверьте, что Focus сервис запущен на порту 3001
2. Проверьте переменную `FOCUS_SERVICE_URL` в `.env` файле Focus Kids
3. Проверьте, что оба сервиса используют один и тот же `JWT_SECRET`

### Ошибка 403 при доступе к Focus Kids

1. Убедитесь, что пользователю выдан доступ: `hasKidsAccess: true`
2. Проверьте, что токен валиден и не истёк
3. Проверьте логи Focus Kids сервиса

### Ошибка при проверке доступа через Focus API

1. Убедитесь, что эндпоинт `GET /api/users/:id` доступен
2. Проверьте, что токен имеет права на чтение информации о пользователе
3. В dev режиме Focus Kids может разрешить доступ даже при недоступности Focus сервиса

## Примеры тестовых данных

Для полноценного тестирования создайте:

1. **Ученика** в Focus Kids:
```bash
curl -X POST http://localhost:8001/api/students \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Иван Иванов",
    "focus_user_id": "your-focus-user-id",
    "group_id": 1
  }'
```

2. **Группу**:
```bash
curl -X POST http://localhost:8001/api/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Группа A1",
    "level": "Beginner"
  }'
```

3. **Посещаемость**:
```bash
curl -X POST http://localhost:8001/api/attendance \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "group_id": 1,
    "lesson_date": "2025-01-29",
    "present": true
  }'
```
