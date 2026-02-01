'use client';

import { useCallback } from 'react';
import { useTelegram } from './useTelegram';

export function useToast() {
  const { inside } = useTelegram();

  const show = useCallback(
    (message: string) => {
      try {
        if (typeof window === 'undefined') return;
        if (inside && window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert(message);
        } else {
          window.alert(message);
        }
      } catch {
        // Не пробрасываем — чтобы не ломать успешный путь формы (регистрация/создание и т.д.)
      }
    },
    [inside]
  );

  return { show };
}
