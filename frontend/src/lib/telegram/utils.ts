export function getTelegramInitData(): string | null {
  if (typeof window === 'undefined') return null;
  const tg = window.Telegram?.WebApp;
  return tg?.initData || null;
}

export function getTelegramUser(): { id: number; first_name: string; last_name?: string; username?: string } | null {
  if (typeof window === 'undefined') return null;
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  return user ? { ...user } : null;
}
