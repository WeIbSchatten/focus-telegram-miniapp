'use client';

import { useEffect } from 'react';
import { initTelegramWebApp, isInsideTelegram } from '@/lib/telegram/init';
import { getTelegramInitData, getTelegramUser } from '@/lib/telegram/utils';

export function useTelegram() {
  const inside = typeof window !== 'undefined' && isInsideTelegram();
  const initData = typeof window !== 'undefined' ? getTelegramInitData() : null;
  const user = typeof window !== 'undefined' ? getTelegramUser() : null;

  useEffect(() => {
    initTelegramWebApp();
  }, []);

  return { inside, initData, user };
}
