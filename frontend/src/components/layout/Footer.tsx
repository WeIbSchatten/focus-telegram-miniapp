'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="mt-auto w-full bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link href={ROUTES.home} className="text-xl font-bold text-white">
              Focus
            </Link>
            <p className="mt-2 text-sm text-white opacity-90">
              Платформа для обучения. Достигай целей с Focus.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white">Сервисы</h4>
            <ul className="mt-2 space-y-1 text-sm text-white opacity-90">
              <li>
                <Link href={ROUTES.kids.root} className="text-kids hover:opacity-90 transition font-medium">
                  Focus Kids — английский для детей
                </Link>
              </li>
              <li>
                <Link href={ROUTES.sense.root} className="text-sense-light hover:opacity-90 transition font-medium">
                  Focus Sense — медитации и аффирмации
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">Контакты</h4>
            <p className="mt-2 text-sm text-white opacity-90">
              По вопросам доступа и сотрудничества обращайтесь к модератору платформы.
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-white/30 pt-6 text-center text-sm text-white opacity-80">
          © {new Date().getFullYear()} Focus. Все права защищены.
          <span className="mx-2">·</span>
          <Link href={ROUTES.license} className="text-white underline hover:opacity-90">
            Лицензионное соглашение
          </Link>
        </div>
      </div>
    </footer>
  );
}
