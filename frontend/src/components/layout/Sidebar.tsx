'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

const kidsNav = [
  { href: ROUTES.kids.root, label: 'Главная' },
  { href: ROUTES.profile, label: 'Личный кабинет' },
  { href: ROUTES.kids.learning, label: 'Обучение' },
  { href: ROUTES.kids.attendance, label: 'Посещаемость' },
  { href: ROUTES.kids.lessons, label: 'Уроки' },
  { href: ROUTES.kids.statistics, label: 'Статистика' },
];

const adminNav = [
  { href: ROUTES.admin.users, label: 'Пользователи' },
  { href: ROUTES.kids.admin.students, label: 'Ученики' },
  { href: ROUTES.kids.admin.teachers, label: 'Преподаватели' },
  { href: ROUTES.kids.admin.groups, label: 'Группы' },
  { href: ROUTES.kids.admin.license, label: 'Лицензионное соглашение' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdminOrModerator = user?.roles?.includes('admin') || user?.roles?.includes('moderator');
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <aside className="w-full shrink-0 space-y-4 md:w-56">
      <nav className="rounded-xl border-2 border-primary/20 bg-white p-4 shadow-soft">
        <ul className="space-y-1">
          {kidsNav.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`block rounded-lg px-3 py-2 font-medium transition ${
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-primary text-white'
                    : 'text-gray-800 hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {isAdminOrModerator && (
        <nav className="rounded-xl border-2 border-kids bg-white p-4 shadow-soft">
          <button
            type="button"
            onClick={() => setAdminOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-medium text-primary transition hover:bg-kids/20"
            aria-expanded={adminOpen}
            aria-haspopup="true"
          >
            Управление
            <svg
              className={`h-4 w-4 shrink-0 transition ${adminOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {adminOpen && (
            <ul className="mt-1 space-y-1">
              {adminNav.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setAdminOpen(false)}
                    className={`block rounded-lg px-3 py-2 font-medium transition ${
                      pathname === href || pathname.startsWith(href + '/')
                        ? 'bg-kids text-gray-900'
                        : 'text-gray-800 hover:bg-kids/30 hover:text-primary'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>
      )}
    </aside>
  );
}
