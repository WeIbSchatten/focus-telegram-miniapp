'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useKidsStore } from '@/store/kidsStore';
import { useToast } from '@/hooks/useToast';
import { kidsClient } from '@/lib/api/kids-client';
import { getKidsApiErrorMessage } from '@/lib/utils/apiError';
import { Sidebar } from '@/components/layout/Sidebar';
import { Loader } from '@/components/common/Loader';
import { ROUTES } from '@/lib/constants';

export default function KidsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, hasKidsAccess, user } = useAuth();
  const { setKidsRole, role } = useKidsStore();
  const { show: toast } = useToast();
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
    if (!hasKidsAccess) {
      router.push(ROUTES.home);
    }
  }, [ready, isAuthenticated, hasKidsAccess, router]);

  useEffect(() => {
    if (!hasKidsAccess || !user?.id || role) return;
    let cancelled = false;
    // Администратор и модератор имеют полный доступ ко всем функциям платформы (роль учителя в Kids)
    if (user.role === 'admin' || user.role === 'moderator') {
      setKidsRole('teacher');
      return;
    }
    Promise.all([
      kidsClient.students.list(),
      kidsClient.teachers.list(),
    ]).then(([students, teachers]) => {
      if (cancelled) return;
      const student = students.find((s) => s.focus_user_id === user.id);
      if (student) {
        setKidsRole('student', undefined, student.id);
        return;
      }
      const teacher = teachers.find((t) => t.focus_user_id === user.id);
      if (teacher) {
        setKidsRole('teacher', teacher.id);
      }
    }).catch((err) => {
      if (!cancelled) toast(getKidsApiErrorMessage(err));
    });
    return () => { cancelled = true; };
  }, [hasKidsAccess, user?.id, user?.role, role, setKidsRole, toast]);

  if (!ready) return <Loader className="min-h-[60vh]" />;
  if (!isAuthenticated) return null;
  if (!hasKidsAccess) return null;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:px-6">
      <Sidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
