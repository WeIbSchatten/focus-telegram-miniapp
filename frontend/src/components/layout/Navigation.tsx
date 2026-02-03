'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

export function getNavItems(hasKidsAccess: boolean, hasSenseAccess: boolean) {
  const items: { href: string; label: string }[] = [{ href: ROUTES.home, label: 'Главная' }];
  if (hasKidsAccess) items.push({ href: ROUTES.kids.root, label: 'Focus Kids' });
  if (hasSenseAccess) items.push({ href: ROUTES.sense.root, label: 'Focus Sense' });
  return items;
}

/** Из ФИО (Фамилия Имя Отчество) возвращает только имя для отображения в шапке. */
function getDisplayName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return '';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return parts[1];
  return parts[0] ?? '';
}

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, hasKidsAccess, hasSenseAccess, logout } = useAuth();
  const navItems = getNavItems(hasKidsAccess, hasSenseAccess);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    router.push(ROUTES.home);
  };

  const dropdownContent = (
    <>
      <Link
        href={ROUTES.profile}
        onClick={() => setMenuOpen(false)}
        className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
      >
        Личный кабинет
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="block w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-100"
      >
        Выйти
      </button>
    </>
  );

  return (
    <nav className="flex w-full min-w-0 flex-1 items-center gap-2 sm:gap-3 md:gap-4 md:w-auto md:flex-initial">
      {navItems.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`whitespace-nowrap text-sm font-medium text-white transition hover:opacity-90 hover:underline sm:text-base ${
            pathname === href ? 'font-semibold underline' : ''
          }`}
        >
          {label}
        </Link>
      ))}
      {isAuthenticated ? (
        <div className="relative ml-auto w-[6rem] shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex w-full min-w-0 items-center justify-center gap-1 rounded-lg border border-white px-2 py-1.5 text-sm font-medium text-white opacity-95 transition hover:bg-white/20 hover:opacity-100"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            title={user?.fullName ?? undefined}
          >
            <span className="truncate">{getDisplayName(user?.fullName) || user?.fullName || ''}</span>
            <svg
              className={`h-4 w-4 shrink-0 transition ${menuOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {menuOpen && (
            <>
              {/* На узких экранах — в потоке документа, без наложения */}
              <div className="mt-1 w-full rounded-lg border border-white/30 bg-white py-1 shadow-lg md:hidden">
                {dropdownContent}
              </div>
              {/* На md+ — абсолютное позиционирование, не выходит за экран */}
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[10rem] max-w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-white/30 bg-white py-1 shadow-lg hidden md:block md:right-0 md:left-auto md:min-w-[12rem]">
                {dropdownContent}
              </div>
            </>
          )}
        </div>
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
