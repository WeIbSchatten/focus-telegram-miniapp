/** Роутер Next.js (push, refresh) для клиентского редиректа с обновлением данных */
export interface NextRouterLike {
  push: (url: string) => void;
  refresh: () => void;
}

/**
 * Полный переход на страницу после успешного сохранения.
 * Задержка даёт React время закрыть модалку/форму и показать тост.
 * Не бросает исключений, чтобы не ломать успешный путь формы.
 */
export function navigateAfterSuccess(path: string, delayMs = 300): void {
  try {
    if (typeof window === 'undefined') return;
    const url = path.startsWith('http') ? path : `${window.location.origin}${path}`;
    setTimeout(() => {
      try {
        window.location.replace(url);
      } catch {
        window.location.href = url;
      }
    }, delayMs);
  } catch {
    // не пробрасываем
  }
}

/**
 * Редирект через Next.js router + refresh: данные на целевой странице подтягиваются сразу.
 * Использовать в клиентских компонентах после успешного сохранения.
 */
export function useNavigateAfterSuccess(router: NextRouterLike, delayMs = 300): (path: string) => void {
  return (path: string) => {
    try {
      setTimeout(() => {
        try {
          router.refresh();
          router.push(path);
        } catch {
          navigateAfterSuccess(path, 0);
        }
      }, delayMs);
    } catch {
      navigateAfterSuccess(path, 0);
    }
  };
}
