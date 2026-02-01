"""
Скрипт для тестирования интеграции между Focus и Focus Kids сервисами.

Использование:
    python test_integration.py

Требования:
    - Запущенные сервисы Focus (порт 3001) и Focus Kids (порт 8001)
    - Установленные зависимости: httpx
"""

import httpx
import json
from typing import Optional

# Конфигурация
FOCUS_URL = "http://localhost:3001"
KIDS_URL = "http://localhost:8001"

# Цвета для вывода
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"


def print_success(msg: str):
  print(f"{GREEN}✓{RESET} {msg}")


def print_error(msg: str):
  print(f"{RED}✗{RESET} {msg}")


def print_info(msg: str):
  print(f"{YELLOW}→{RESET} {msg}")


def test_focus_service():
  """Тестирует базовые эндпоинты Focus сервиса"""
  print("\n" + "=" * 60)
  print("ТЕСТИРОВАНИЕ FOCUS СЕРВИСА")
  print("=" * 60)

  with httpx.Client() as client:
    # 1. Регистрация пользователя
    print_info("1. Регистрация нового пользователя...")
    register_data = {
      "email": "test@example.com",
      "password": "testpassword123",
      "fullName": "Test User"
    }
    try:
      response = client.post(f"{FOCUS_URL}/api/auth/register", json=register_data)
      if response.status_code == 201:
        user_data = response.json()
        user_id = user_data["id"]
        print_success(f"Пользователь зарегистрирован: {user_id}")
      else:
        print_error(f"Ошибка регистрации: {response.status_code} - {response.text}")
        return None
    except Exception as e:
      print_error(f"Ошибка при регистрации: {e}")
      return None

    # 2. Логин
    print_info("2. Логин пользователя...")
    login_data = {
      "email": "test@example.com",
      "password": "testpassword123"
    }
    try:
      response = client.post(f"{FOCUS_URL}/api/auth/login", json=login_data)
      if response.status_code == 200:
        auth_data = response.json()
        token = auth_data["accessToken"]
        print_success(f"Токен получен: {token[:20]}...")
      else:
        print_error(f"Ошибка логина: {response.status_code} - {response.text}")
        return None
    except Exception as e:
      print_error(f"Ошибка при логине: {e}")
      return None

    # 3. Получение информации о пользователе
    print_info("3. Получение информации о пользователе (GET /api/auth/me)...")
    try:
      response = client.get(
        f"{FOCUS_URL}/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
      )
      if response.status_code == 200:
        me_data = response.json()
        print_success(f"Информация получена:")
        print(f"   - ID: {me_data['id']}")
        print(f"   - Email: {me_data['email']}")
        print(f"   - Role: {me_data['role']}")
        print(f"   - Status: {me_data['status']}")
        print(f"   - hasKidsAccess: {me_data['hasKidsAccess']}")
        return user_id, token, me_data
      else:
        print_error(f"Ошибка получения информации: {response.status_code} - {response.text}")
        return None
    except Exception as e:
      print_error(f"Ошибка: {e}")
      return None


def test_kids_service_without_access(token: str, user_id: str):
  """Тестирует Focus Kids без доступа"""
  print("\n" + "=" * 60)
  print("ТЕСТИРОВАНИЕ FOCUS KIDS (БЕЗ ДОСТУПА)")
  print("=" * 60)

  with httpx.Client() as client:
    print_info("Попытка доступа к Focus Kids без hasKidsAccess...")
    try:
      response = client.get(
        f"{KIDS_URL}/api/students",
        headers={"Authorization": f"Bearer {token}"}
      )
      if response.status_code == 403:
        print_success("Доступ корректно запрещён (403 Forbidden)")
      else:
        print_error(f"Неожиданный статус: {response.status_code}")
        print(f"   Ответ: {response.text}")
    except Exception as e:
      print_error(f"Ошибка: {e}")


def test_kids_service_with_access(token: str, user_id: str):
  """Тестирует Focus Kids с доступом"""
  print("\n" + "=" * 60)
  print("ТЕСТИРОВАНИЕ FOCUS KIDS (С ДОСТУПОМ)")
  print("=" * 60)

  with httpx.Client() as client:
    # 1. Проверка health
    print_info("1. Проверка health эндпоинта...")
    try:
      response = client.get(f"{KIDS_URL}/health")
      if response.status_code == 200:
        print_success(f"Health check: {response.json()}")
      else:
        print_error(f"Health check failed: {response.status_code}")
    except Exception as e:
      print_error(f"Ошибка health check: {e}")

    # 2. Получение списка студентов (требует доступ)
    print_info("2. Получение списка студентов...")
    try:
      response = client.get(
        f"{KIDS_URL}/api/students",
        headers={"Authorization": f"Bearer {token}"}
      )
      if response.status_code == 200:
        students = response.json()
        print_success(f"Получено студентов: {len(students)}")
      elif response.status_code == 403:
        print_error("Доступ запрещён - проверьте hasKidsAccess")
      else:
        print_error(f"Неожиданный статус: {response.status_code}")
        print(f"   Ответ: {response.text}")
    except Exception as e:
      print_error(f"Ошибка: {e}")


def grant_kids_access(focus_url: str, user_id: str, moderator_token: str):
  """Выдаёт доступ к Focus Kids пользователю (требует токен модератора)"""
  print_info("Выдача доступа к Focus Kids...")
  with httpx.Client() as client:
    try:
      response = client.patch(
        f"{focus_url}/api/moderation/users/{user_id}/kids-access",
        json={"hasAccess": True},
        headers={"Authorization": f"Bearer {moderator_token}"}
      )
      if response.status_code == 200:
        print_success("Доступ к Focus Kids выдан")
        return True
      else:
        print_error(f"Ошибка выдачи доступа: {response.status_code} - {response.text}")
        return False
    except Exception as e:
      print_error(f"Ошибка: {e}")
      return False


def main():
  print("\n" + "=" * 60)
  print("ТЕСТИРОВАНИЕ ИНТЕГРАЦИИ FOCUS ↔ FOCUS KIDS")
  print("=" * 60)
  print("\nУбедитесь, что оба сервиса запущены:")
  print(f"  - Focus: {FOCUS_URL}")
  print(f"  - Focus Kids: {KIDS_URL}")

  # Тест Focus сервиса
  result = test_focus_service()
  if not result:
    print_error("\nНе удалось пройти тесты Focus сервиса. Проверьте, что сервис запущен.")
    return

  user_id, token, user_data = result

  # Тест без доступа
  test_kids_service_without_access(token, user_id)

  # Запрос на выдачу доступа
  print("\n" + "=" * 60)
  print("ВЫДАЧА ДОСТУПА К FOCUS KIDS")
  print("=" * 60)
  print_info("Для выдачи доступа нужен токен модератора/админа.")
  print_info("Вы можете:")
  print("  1. Вручную через API:")
  print(f"     PATCH {FOCUS_URL}/api/moderation/users/{user_id}/kids-access")
  print('     Body: {"hasAccess": true}')
  print("     Headers: Authorization: Bearer <moderator_token>")
  print("\n  2. Или введите токен модератора для автоматической выдачи:")

  moderator_token = input("Токен модератора (или Enter для пропуска): ").strip()
  if moderator_token:
    if grant_kids_access(FOCUS_URL, user_id, moderator_token):
      # Проверяем, что доступ выдан
      with httpx.Client() as client:
        response = client.get(
          f"{FOCUS_URL}/api/auth/me",
          headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
          updated_data = response.json()
          if updated_data.get("hasKidsAccess"):
            print_success("Доступ подтверждён!")
            test_kids_service_with_access(token, user_id)
          else:
            print_error("Доступ не был выдан. Проверьте токен модератора.")
    else:
      print_error("Не удалось выдать доступ.")
  else:
    print_info("Пропущено. Выдайте доступ вручную и запустите скрипт снова.")

  print("\n" + "=" * 60)
  print("ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
  print("=" * 60)


if __name__ == "__main__":
  main()
