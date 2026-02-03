'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuth();

  useEffect(() => {
    if (accessToken === null) return;
    if (!accessToken || !isAuthenticated) {
      router.replace(ROUTES.auth.login);
      return;
    }
    if (!user?.roles?.includes('admin') && !user?.roles?.includes('moderator')) {
      router.replace(ROUTES.home);
    }
  }, [accessToken, isAuthenticated, user?.roles, router]);

  if (accessToken === null) return null;
  if (!user?.roles?.includes('admin') && !user?.roles?.includes('moderator')) return null;
  return <>{children}</>;
}
