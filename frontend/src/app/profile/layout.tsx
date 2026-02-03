'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { Loader } from '@/components/common/Loader';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setChecked(true);
      if (!accessToken) {
        router.replace(ROUTES.auth.login);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [accessToken, router]);

  if (!checked || !accessToken) return <Loader className="min-h-[40vh]" />;
  return <>{children}</>;
}
