/**
 * Сообщение для пользователя при ошибке запроса к Kids API (сеть, 5xx, 4xx).
 * При сетевой ошибке подсказка про пересборку фронта в Docker.
 */
export const KIDS_API_UNREACHABLE_HINT =
  ' При запуске через Docker пересоберите фронт: docker-compose build --no-cache frontend && docker-compose up -d.';

export function getKidsApiErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return 'Ошибка запроса';
  const e = err as {
    code?: string;
    message?: string;
    response?: { status?: number; data?: { detail?: string | string[] } };
  };
  const status = e.response?.status;
  const detail = e.response?.data?.detail;
  const detailStr =
    detail === undefined ? '' : Array.isArray(detail) ? detail[0] ?? '' : String(detail);

  if (!e.response) {
    // Сеть: запрос не дошёл до сервера (connection refused, timeout, CORS и т.п.)
    return (
      'Сервис Focus Kids недоступен. Проверьте, что бэкенд запущен и прокси настроен.' +
      KIDS_API_UNREACHABLE_HINT
    );
  }
  if (status && status >= 500) {
    return detailStr || `Ошибка сервера (${status}). Попробуйте позже.`;
  }
  if (status === 403) {
    return detailStr || 'Доступ запрещён. Обратитесь к администратору.';
  }
  if (status === 401) {
    return 'Сессия истекла. Войдите снова.';
  }
  if (detailStr) return detailStr;
  if (status) return `Ошибка запроса (${status}).`;
  return e.message || 'Ошибка запроса';
}
