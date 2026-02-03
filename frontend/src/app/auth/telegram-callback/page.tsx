'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { focusClient } from '@/lib/api/focus-client';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/lib/constants';
import { Loader } from '@/components/common/Loader';

export default function TelegramCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('id');
    const hash = searchParams.get('hash');
    const auth_date = searchParams.get('auth_date');
    const first_name = searchParams.get('first_name');

    if (!id || !hash || !auth_date || first_name === null) {
      setError('Нет данных от Telegram. Войдите через кнопку на странице входа.');
      setTimeout(() => router.replace(ROUTES.auth.login), 2000);
      return;
    }

    let cancelled = false;
    const params = {
      id,
      first_name: first_name || '',
      last_name: searchParams.get('last_name') ?? undefined,
      username: searchParams.get('username') ?? undefined,
      photo_url: searchParams.get('photo_url') ?? undefined,
      auth_date,
      hash,
    };

    focusClient.auth
      .telegramWidget(params)
      .then(async (res) => {
        if (cancelled) return;
        setAuth(res.accessToken, null);
        const me = await focusClient.auth.me();
        setUser(me);
        router.replace(ROUTES.home);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err?.response?.data?.message ??
          (Array.isArray(err?.response?.data?.message)
            ? err.response.data.message[0]
            : 'Ошибка входа через Telegram');
        setError(typeof msg === 'string' ? msg : 'Ошибка входа через Telegram');
        setTimeout(() => router.replace(ROUTES.auth.login), 3000);
      });

    return () => {
      cancelled = true;
    };
  }, [router, searchParams, setAuth, setUser]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <p className="text-red-600">{error}</p>
        <p className="mt-2 text-sm text-gray-600">Перенаправление на страницу входа…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader />
    </div>
  );
}
