import * as crypto from 'crypto';

/**
 * Валидация initData от Telegram WebApp.
 * Документация: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Алгоритм:
 * 1. secret_key = HMAC-SHA256(bot_token, "WebAppData")
 * 2. data_check_string = пары key=value (кроме hash), отсортированные по key, объединённые через \n
 * 3. calculated_hash = HMAC-SHA256(secret_key, data_check_string) в hex
 * 4. Сравнить с полем hash из initData
 */
export function validateTelegramWebAppData(initData: string, botToken: string): boolean {
  if (!initData?.trim() || !botToken?.trim()) {
    return false;
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) {
    return false;
  }

  params.delete('hash');
  const sortedKeys = Array.from(params.keys()).sort();
  const dataCheckString = sortedKeys.map((key) => `${key}=${params.get(key)}`).join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return calculatedHash === hash;
}

/**
 * Извлечь user из initData (JSON в поле user).
 */
export function parseTelegramUserFromInitData(initData: string): {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
} | null {
  const params = new URLSearchParams(initData);
  const userStr = params.get('user');
  if (!userStr) {
    return null;
  }
  try {
    return JSON.parse(userStr) as {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  } catch {
    return null;
  }
}

/**
 * Валидация данных Telegram Login Widget (редирект с сайта).
 * Документация: https://core.telegram.org/widgets/login#checking-authorization
 *
 * data_check_string = все поля кроме hash, отсортированные по key, key=value через \n
 * secret_key = SHA256(bot_token)
 * hash === hex(HMAC-SHA256(secret_key, data_check_string))
 */
export function validateTelegramWidgetData(
  params: Record<string, string>,
  botToken: string
): boolean {
  const hash = params.hash;
  if (!hash || !botToken?.trim()) {
    return false;
  }

  const dataCheckString = Object.keys(params)
    .filter((k) => k !== 'hash')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return calculatedHash === hash;
}
