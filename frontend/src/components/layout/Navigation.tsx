'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: ROUTES.home, label: 'Главная' },
  { href: ROUTES.kids.root, label: 'Focus Kids' },
];

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push(ROUTES.home);
  };

  return (
    <nav className="flex flex-wrap items-center gap-4 md:gap-6">
      {navItems.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`font-medium text-white transition hover:opacity-90 hover:underline ${
            pathname === href ? 'font-semibold underline' : ''
          }`}
        >
          {label}
        </Link>
      ))}
      {isAuthenticated ? (
        <>
          <span className="text-white md:ml-2 opacity-95">{user?.fullName}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-white px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition"
          >
            Выйти
          </button>
        </>
      ) : (
        <>
          <Link
            href={ROUTES.auth.login}
            className="font-medium text-white transition hover:opacity-90 hover:underline"
          >
            Вход
          </Link>
          <Link
            href={ROUTES.auth.register}
            className="rounded-lg bg-white px-4 py-2 font-semibold text-primary hover:bg-gray-100 transition"
          >
            Зарегистрироваться
          </Link>
        </>
      )}
    </nav>
  );
}
