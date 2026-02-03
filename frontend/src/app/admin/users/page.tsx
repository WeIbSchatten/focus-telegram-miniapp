'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { focusClient } from '@/lib/api/focus-client';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { PageHeader, PAGE_ACTION_BUTTON_CLASS } from '@/components/layout/PageHeader';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/lib/constants';
import type { FocusUser, UserRole } from '@/types/user';
import { hasRole } from '@/types/user';

type UserRow = FocusUser & { createdAt?: string };

const ROLE_OPTIONS: UserRole[] = ['admin', 'moderator', 'teacher', 'student', 'user'];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  moderator: 'Модератор',
  teacher: 'Учитель',
  student: 'Ученик',
  user: 'Пользователь',
};

export default function PlatformAdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { show: toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const isAdmin = hasRole(user, 'admin');

  const loadUsers = useCallback(() => {
    setLoading(true);
    focusClient.users
      .list()
      .then((list) => setUsers(list))
      .catch(() => toast('Не удалось загрузить пользователей'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    if (!hasRole(user, 'admin') && !hasRole(user, 'moderator')) {
      router.push(ROUTES.home);
      return;
    }
    let cancelled = false;
    focusClient.users
      .list()
      .then((list) => {
        if (!cancelled) setUsers(list);
      })
      .catch(() => toast('Не удалось загрузить пользователей'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, router, toast]);

  const handleKidsAccess = async (userId: string, hasAccess: boolean) => {
    setUpdating(userId);
    try {
      await focusClient.moderation.setKidsAccess(userId, hasAccess);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, hasKidsAccess: hasAccess } : u))
      );
      toast(hasAccess ? 'Доступ к Focus Kids выдан' : 'Доступ к Focus Kids отозван');
    } catch {
      toast('Ошибка изменения доступа');
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleRole = async (userId: string, role: UserRole, checked: boolean) => {
    if (!isAdmin) return;
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const currentRoles = targetUser.roles ?? [];
    const newRoles = checked
      ? Array.from(new Set([...currentRoles, role]))
      : currentRoles.filter((r) => r !== role);
    const rolesToSave = newRoles.length ? newRoles : ['user'];
    setUpdating(userId);
    try {
      const { roles: savedRoles } = await focusClient.users.setRoles(userId, rolesToSave);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, roles: savedRoles as UserRole[] } : u))
      );

      if (role === 'teacher' && checked) {
        try {
          const teachers = await kidsClient.teachers.list();
          if (!teachers.some((t) => t.focus_user_id === userId)) {
            await kidsClient.teachers.create({
              focus_user_id: userId,
              full_name: targetUser.fullName || targetUser.email,
            });
          }
        } catch {
          toast('Роль учителя в Focus сохранена, но не удалось добавить в преподаватели Focus Kids. Проверьте доступ к Kids.');
        }
      }
      if (role === 'teacher' && !checked) {
        try {
          const teachers = await kidsClient.teachers.list();
          const teacher = teachers.find((t) => t.focus_user_id === userId);
          if (teacher) await kidsClient.teachers.delete(teacher.id);
        } catch {
          toast('Роль учителя в Focus убрана, но не удалось удалить из преподавателей Focus Kids.');
        }
      }
      if (role === 'student' && checked) {
        try {
          const students = await kidsClient.students.list();
          if (!students.some((s) => s.focus_user_id === userId)) {
            await kidsClient.students.create({
              focus_user_id: userId,
              full_name: targetUser.fullName || targetUser.email,
              group_id: undefined,
            });
          }
        } catch {
          toast('Роль ученика в Focus сохранена, но не удалось добавить в ученики Focus Kids. Проверьте доступ к Kids.');
        }
      }
      if (role === 'student' && !checked) {
        try {
          const students = await kidsClient.students.list();
          const student = students.find((s) => s.focus_user_id === userId);
          if (student) await kidsClient.students.delete(student.id);
        } catch {
          toast('Роль ученика в Focus убрана, но не удалось удалить из учеников Focus Kids (возможно, есть связанные данные).');
        }
      }

      await loadUsers();
      toast('Роли обновлены');
    } catch {
      toast('Ошибка изменения ролей');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (u: UserRow) => {
    if (u.id === user?.id) {
      toast('Нельзя удалить самого себя');
      return;
    }
    if (
      !confirm(
        `Удалить пользователя ${u.email} (${u.fullName})? Это действие нельзя отменить.`
      )
    )
      return;
    setUpdating(u.id);
    try {
      await focusClient.users.delete(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast('Пользователь удалён');
    } catch (err: unknown) {
      const data =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data
          : undefined;
      const raw = data?.message;
      const msg =
        typeof raw === 'string'
          ? raw
          : Array.isArray(raw)
            ? raw[0] ?? 'Не удалось удалить'
            : 'Не удалось удалить';
      toast(msg);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <Loader className="min-h-[40vh]" />;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <PageHeader
        title="Управление пользователями"
        actions={
          <Link href={ROUTES.admin.register}>
            <Button variant="outline" className={PAGE_ACTION_BUTTON_CLASS}>
              Зарегистрировать пользователя
            </Button>
          </Link>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/20 text-left text-gray-700">
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">ФИО</th>
                <th className="py-2 pr-4">Роли</th>
                <th className="py-2 pr-4">Focus Kids</th>
                <th className="py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 text-gray-800">
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4">{u.fullName}</td>
                  <td className="py-2 pr-4">
                    {isAdmin ? (
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {ROLE_OPTIONS.map((r) => (
                          <label key={r} className="flex items-center gap-1.5 text-gray-800">
                            <input
                              type="checkbox"
                              checked={(u.roles ?? []).includes(r)}
                              onChange={(e) => handleToggleRole(u.id, r, e.target.checked)}
                              disabled={updating === u.id}
                              className="rounded border-primary/40"
                            />
                            <span className="text-xs">{ROLE_LABELS[r]}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      (u.roles ?? [])
                        .map((r) => ROLE_LABELS[r] ?? r)
                        .join(', ') || ROLE_LABELS.user
                    )}
                  </td>
                  <td className="py-2 pr-4">{u.hasKidsAccess ? 'Да' : 'Нет'}</td>
                  <td className="py-2">
                    <div className="flex flex-nowrap items-center gap-2">
                      <Button
                        variant="outline"
                        className="min-w-[7rem] shrink-0 text-sm"
                        onClick={() => handleKidsAccess(u.id, !u.hasKidsAccess)}
                        disabled={
                          updating === u.id ||
                          (u.roles ?? []).includes('admin') ||
                          (u.roles ?? []).includes('moderator')
                        }
                      >
                        {u.hasKidsAccess ? 'Забрать Kids' : 'Выдать Kids'}
                      </Button>
                      <Button
                        variant="outline"
                        className="min-w-[7rem] shrink-0 text-sm text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(u)}
                        disabled={updating === u.id || u.id === user?.id}
                        title={
                          u.id === user?.id
                            ? 'Нельзя удалить себя'
                            : 'Удалить пользователя'
                        }
                      >
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Назад
        </button>
      </div>
    </div>
  );
}
