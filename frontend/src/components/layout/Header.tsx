'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from './Navigation';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, hasKidsAccess, hasSenseAccess } = useAuth();
  const logoHref = isAuthenticated
    ? hasKidsAccess
      ? ROUTES.kids.root
      : hasSenseAccess
        ? ROUTES.sense.root
        : ROUTES.home
    : ROUTES.home;

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-banner shadow-soft">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link
          href={logoHref}
          className="text-2xl font-bold text-white transition hover:opacity-90"
        >
          Focus
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:block">
          <Navigation />
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="rounded-lg p-2 text-white hover:bg-white/10 md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Меню"
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

      {/* Mobile nav */}
      {menuOpen && (
        <div className="border-t border-white/20 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Navigation />
          </nav>
        </div>
      )}
    </header>
  );
}
