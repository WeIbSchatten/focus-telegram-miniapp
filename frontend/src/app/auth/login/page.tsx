'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/hooks/useTelegram';
import { useToast } from '@/hooks/useToast';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ROUTES } from '@/lib/constants';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginTelegram, linkTelegram, isAuthenticated } = useAuth();
  const { inside, initData } = useTelegram();
  const { show: toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);
  const [error, setError] = useState('');
  const [needLink, setNeedLink] = useState(false);

  if (isAuthenticated) {
    router.push(ROUTES.home);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      if (needLink && initData) {
        await linkTelegram();
        toast('Telegram привязан. Дальше можно входить через «Войти через Telegram».');
      }
      router.push(ROUTES.home);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Ошибка входа';
      setError(Array.isArray(msg) ? msg[0] : String(msg));
      toast(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramLogin = async () => {
    if (!initData) {
      toast('Откройте приложение через Telegram бота.');
      return;
    }
    setError('');
    setNeedLink(false);
    setTgLoading(true);
    try {
      await loginTelegram();
      router.push(ROUTES.home);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Ошибка входа через Telegram';
      const str = Array.isArray(msg) ? msg[0] : String(msg);
      setError(str);
      toast(str);
      if (str.includes('not linked') || str.includes('не привязан') || str.includes('link')) {
        setNeedLink(true);
      }
    } finally {
      setTgLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <h1 className="text-heading text-primary">Вход</h1>
        <p className="mt-2 text-gray-700">
          {needLink
            ? 'Этот Telegram ещё не привязан к аккаунту Focus. Введите email и пароль от вашего аккаунта — после этого вход из бота будет автоматическим.'
            : 'Войдите в аккаунт Focus'}
        </p>

        {inside && initData && !needLink && (
          <div className="mt-6">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleTelegramLogin}
              loading={tgLoading}
            >
              Войти через Telegram
            </Button>
            <p className="mt-4 text-center text-sm text-gray-600">или</p>
          </div>
        )}

        {needLink && inside && initData && (
          <p className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setNeedLink(false); setError(''); }}
              className="text-sm text-primary hover:underline"
            >
              Попробовать снова войти через Telegram
            </button>
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Войти
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-700">
          Нет аккаунта?{' '}
          <Link href={ROUTES.auth.register} className="font-medium text-primary hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </Card>
    </div>
  );
}
