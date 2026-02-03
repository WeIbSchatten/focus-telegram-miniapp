'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

const senseNav = [
  { href: ROUTES.sense.root, label: 'Главная' },
  { href: ROUTES.sense.meditations, label: 'Медитации' },
  { href: ROUTES.sense.affirmations, label: 'Аффирмации' },
];

const senseAdminNav = [
  { href: ROUTES.sense.admin, label: 'Управление контентом' },
  { href: ROUTES.admin.users, label: 'Пользователи' },
];

export function SidebarSense() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdminOrModerator = user?.roles?.includes('admin') || user?.roles?.includes('moderator');

  return (
    <aside className="w-full shrink-0 space-y-4 md:w-56">
      <nav className="rounded-xl border-2 border-sense/30 bg-white p-4 shadow-[var(--shadow-sense)]">
        <ul className="space-y-1">
          {senseNav.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`block rounded-lg px-3 py-2 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sense focus-visible:ring-offset-1 ${
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-sense text-white'
                    : 'text-gray-800 hover:bg-sense/10 hover:text-sense'
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {isAdminOrModerator && (
        <nav className="rounded-xl border-2 border-sense/50 bg-white p-4 shadow-[var(--shadow-sense)]">
          <p className="mb-2 text-sm font-semibold text-sense">Управление</p>
          <ul className="space-y-1">
            {senseAdminNav.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`block rounded-lg px-3 py-2 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sense focus-visible:ring-offset-1 ${
                    pathname === href || pathname.startsWith(href + '/')
                      ? 'bg-sense text-white'
                      : 'text-gray-800 hover:bg-sense/20 hover:text-sense'
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </aside>
  );
}
