'use client';

import { useEffect } from 'react';
import { initTelegramWebApp } from '@/lib/telegram/init';

/**
 * Вызывает tg.ready() и tg.expand() при первой загрузке, если приложение открыто в Telegram.
 * Без этого Telegram показывает бесконечный индикатор загрузки Mini App.
 */
export function TelegramWebAppInit() {
  useEffect(() => {
    initTelegramWebApp();
  }, []);
  return null;
}
