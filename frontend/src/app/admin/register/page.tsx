'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { focusClient } from '@/lib/api/focus-client';
import { useToast } from '@/hooks/useToast';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ROUTES } from '@/lib/constants';
import { useNavigateAfterSuccess } from '@/lib/utils/navigation';
import { isValidEmail, isValidPassword } from '@/lib/utils/validation';

export default function AdminRegisterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { show: toast } = useToast();
  const navigateAfterSuccess = useNavigateAfterSuccess(router);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user?.role !== 'admin' && user?.role !== 'moderator') {
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
    try {
      await focusClient.auth.register({ email, password, fullName });
      setError('');
      toast('Пользователь успешно зарегистрирован.');
      navigateAfterSuccess(ROUTES.admin.users);
    } catch (err: unknown) {
      const status =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : 0;
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Ошибка регистрации';
      const message = Array.isArray(msg) ? msg[0] : String(msg);
      if ((status ?? 0) >= 400) {
        setError(message);
        toast(message);
      } else {
        setError('');
        toast('Пользователь успешно зарегистрирован.');
        navigateAfterSuccess(ROUTES.admin.users);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8">
      <h1 className="text-heading text-primary">Регистрация пользователя</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          />
          <Input
            label="Пароль (не менее 6 символов)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" loading={loading}>
              Зарегистрировать
            </Button>
            <Link href={ROUTES.admin.users}>
              <Button type="button" variant="outline">
                Отмена
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
