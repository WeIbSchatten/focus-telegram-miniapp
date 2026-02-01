'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function KidsAdminPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(ROUTES.kids.admin.users);
  }, [router]);
  return null;
}
