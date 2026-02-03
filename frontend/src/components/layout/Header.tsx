'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from './Navigation';

export function Header() {
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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 md:px-6">
        <Link
          href={logoHref}
          className="shrink-0 text-xl font-bold text-white transition hover:opacity-90 sm:text-2xl"
        >
          Focus
        </Link>

        <Navigation />
      </div>
    </header>
  );
}
