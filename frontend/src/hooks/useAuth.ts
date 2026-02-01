'use client';

import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { focusClient } from '@/lib/api/focus-client';
import { getTelegramInitData } from '@/lib/telegram/utils';

export function useAuth() {
  const { accessToken, user, setAuth, setUser, logout } = useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      const { accessToken: token } = await focusClient.auth.login({ email, password });
      setAuth(token, null);
      const me = await focusClient.auth.me();
      setUser(me);
      return me;
    },
    [setAuth, setUser]
  );

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      await focusClient.auth.register({ email, password, fullName });
    },
    []
  );

  const loginTelegram = useCallback(async () => {
    const initData = getTelegramInitData();
    if (!initData) throw new Error('Telegram initData not available');
    const { accessToken: token } = await focusClient.auth.telegram(initData);
    setAuth(token, null);
    const me = await focusClient.auth.me();
    setUser(me);
    return me;
  }, [setAuth, setUser]);

  /** Привязать текущий Telegram к аккаунту Focus (нужен JWT — вызвать после login). */
  const linkTelegram = useCallback(async () => {
    const initData = getTelegramInitData();
    if (!initData) throw new Error('Telegram initData not available');
    const { telegramUserId } = await focusClient.auth.linkTelegram(initData);
    return telegramUserId;
  }, []);

  /** Отвязать Telegram от текущего аккаунта. */
  const unlinkTelegram = useCallback(async () => {
    const updated = await focusClient.auth.unlinkTelegram();
    setUser(updated);
    return updated;
  }, [setUser]);

  const refreshMe = useCallback(async () => {
    if (!accessToken) return null;
    const me = await focusClient.auth.me();
    setUser(me);
    return me;
  }, [accessToken, setUser]);

  useEffect(() => {
    if (accessToken && !user) {
      refreshMe();
    }
  }, [accessToken, user, refreshMe]);

  const isAuthenticated = Boolean(accessToken);
  const hasKidsAccess = user?.hasKidsAccess ?? false;

  return {
    accessToken,
    user,
    isAuthenticated,
    hasKidsAccess,
    login,
    register,
    loginTelegram,
    linkTelegram,
    unlinkTelegram,
    refreshMe,
    logout,
  };
}
