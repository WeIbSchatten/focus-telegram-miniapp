'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function SenseAdminUsersRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace(ROUTES.admin.users);
  }, [router]);
  return null;
}
