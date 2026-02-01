'use client';

import { useAuthStore } from '@/store/authStore';

export function useUser() {
  const user = useAuthStore((s) => s.user);
  return user;
}
