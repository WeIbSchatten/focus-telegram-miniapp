'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from './Navigation';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, hasKidsAccess, hasSenseAccess } = useAuth();

  const logoHref = (() => {
    if (!isAuthenticated) return ROUTES.home;
    if (pathname === '/' || pathname === ROUTES.home) return ROUTES.home;
    if (pathname.startsWith('/sense') && hasSenseAccess) return ROUTES.sense.root;
    if (pathname.startsWith('/kids') && hasKidsAccess) return ROUTES.kids.root;
    return hasKidsAccess ? ROUTES.kids.root : hasSenseAccess ? ROUTES.sense.root : ROUTES.home;
  })();

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-banner shadow-soft">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 md:px-6">
        <Link
          href={logoHref}
          className="shrink-0 text-xl font-bold text-white transition hover:opacity-90 sm:text-2xl"
        >
          Focus
        </Link>

        {/* На md+ — навигация в одну строку */}
        <div className="hidden md:block">
          <Navigation />
        </div>

        {/* На узких — кнопка меню, по клику выпадающий список */}
        <button
          type="button"
          className="rounded-lg p-2 text-white hover:bg-white/10 md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Меню"
          aria-expanded={menuOpen}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Выпадающий список на узких экранах: те же параметры строки и кнопок */}
      {menuOpen && (
        <div className="border-t border-white/20 px-3 py-3 sm:px-4 md:hidden">
          <nav className="flex flex-row flex-wrap items-center gap-2 sm:gap-3">
            <Navigation />
          </nav>
        </div>
      )}
    </header>
  );
}
