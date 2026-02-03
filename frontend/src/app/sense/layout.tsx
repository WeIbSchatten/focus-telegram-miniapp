'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SidebarSense } from '@/components/layout/SidebarSense';
import { Loader } from '@/components/common/Loader';
import { ROUTES } from '@/lib/constants';

export default function SenseLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.push(ROUTES.auth.login);
      return;
    }
  }, [ready, isAuthenticated, router]);

  if (!ready) return <Loader className="min-h-[60vh]" />;
  if (!isAuthenticated) return null;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:px-6">
      <SidebarSense />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
