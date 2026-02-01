'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ROUTES } from '@/lib/constants';
import { isValidEmail, isValidPassword } from '@/lib/utils/validation';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const { show: toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (isAuthenticated) {
    router.push(ROUTES.home);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setError('Введите корректный email');
      return;
    }
    if (!isValidPassword(password)) {
      setError('Пароль не менее 6 символов');
      return;
    }
    setLoading(true);
    let registrationSucceeded = false;
    try {
      await register(email, password, fullName);
      registrationSucceeded = true;
      setError('');
      setSuccess(true);
      toast('Аккаунт зарегистрирован. Доступ к Focus Kids выдаётся модератором после входа.');
      setTimeout(() => router.push(ROUTES.auth.login), 2500);
    } catch (err: unknown) {
      setLoading(false);
      if (registrationSucceeded) {
        setSuccess(true);
        toast('Аккаунт зарегистрирован. Доступ к Focus Kids выдаётся модератором после входа.');
        setTimeout(() => router.push(ROUTES.auth.login), 2500);
        return;
      }
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number; data?: { message?: string | string[] } } }).response : undefined;
      if (res && res.status && res.status >= 200 && res.status < 300) {
        setError('');
        setSuccess(true);
        toast('Аккаунт зарегистрирован. Доступ к Focus Kids выдаётся модератором после входа.');
        setTimeout(() => router.push(ROUTES.auth.login), 2500);
        return;
      }
      const msg = res?.data?.message ?? 'Ошибка регистрации';
      setError(Array.isArray(msg) ? msg[0] : String(msg));
      toast(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <Card>
          <h1 className="text-heading text-primary">Аккаунт создан</h1>
          <p className="mt-4 text-gray-700">
            Регистрация прошла успешно. Вы можете войти в Focus. Доступ к Focus Kids выдаётся модератором или администратором после входа.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Переход к странице входа через несколько секунд…
          </p>
          <Link href={ROUTES.auth.login} className="mt-6 block">
            <Button type="button" variant="primary" className="w-full">
              Перейти к входу
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <h1 className="text-heading text-primary">Зарегистрироваться</h1>
        <p className="mt-2 text-gray-700">Регистрация для доступа к сервисам Focus</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="ФИО"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Иван Иванов"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Пароль (не менее 6 символов)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Зарегистрироваться
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-700">
          Уже есть аккаунт?{' '}
          <Link href={ROUTES.auth.login} className="font-medium text-primary hover:underline">
            Войти
          </Link>
        </p>
      </Card>
    </div>
  );
}
