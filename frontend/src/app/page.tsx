'use client';

import Link from 'next/link';
import { ServicesList } from '@/components/focus/ServicesList';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      {!isAuthenticated && (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-banner px-6 py-16 text-white shadow-soft-lg md:py-24">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-display font-bold text-white">Достигай целей с Focus</h1>
            <p className="mt-4 text-lg text-white opacity-95 md:text-xl">
              Платформа для обучения. Регистрируйтесь и получайте доступ к сервисам после одобрения модератора.
            </p>
            <div className="mt-8 flex flex-wrap items-stretch gap-4">
              <Link href={ROUTES.auth.register} className="inline-flex">
                <Button variant="primary" className="min-w-[180px] h-12 !bg-white !text-gray-900 hover:!bg-white/95">
                  Зарегистрироваться
                </Button>
              </Link>
              <Link href={ROUTES.auth.login} className="inline-flex">
                <Button variant="outline" className="min-w-[180px] h-12 border-white text-white hover:bg-white/10">
                  Войти
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <ServicesList />
    </div>
  );
}
