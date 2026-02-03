'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function KidsProfileRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace(ROUTES.profile);
  }, [router]);
  return null;
}
