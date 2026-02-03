'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { focusClient } from '@/lib/api/focus-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { PageHeader, PAGE_ACTION_BUTTON_CLASS } from '@/components/layout/PageHeader';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/lib/constants';
import type { FocusUser } from '@/types/user';

type UserRow = FocusUser & { createdAt?: string };

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  moderator: 'Модератор',
  teacher: 'Учитель',
  student: 'Ученик',
  user: 'Пользователь',
};
export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { show: toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'moderator') {
      router.push(ROUTES.kids.root);
      return;
    }
    let cancelled = false;
    focusClient.users.list().then((list) => {
      if (!cancelled) setUsers(list);
    }).catch(() => toast('Не удалось загрузить пользователей')).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.role, router, toast]);

  const handleKidsAccess = async (userId: string, hasAccess: boolean) => {
    setUpdating(userId);
    try {
      await focusClient.moderation.setKidsAccess(userId, hasAccess);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, hasKidsAccess: hasAccess } : u));
      toast(hasAccess ? 'Доступ к Focus Kids выдан' : 'Доступ к Focus Kids отозван');
    } catch {
      toast('Ошибка изменения доступа');
    } finally {
      setUpdating(null);
    }
  };

  const handleSetRole = async (userId: string, role: string) => {
    if (!isAdmin) return;
    setUpdating(userId);
    try {
      await focusClient.users.setRole(userId, role);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: role as FocusUser['role'] } : u));
      toast('Роль обновлена');
    } catch {
      toast('Ошибка изменения роли');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (u: UserRow) => {
    if (u.id === user?.id) {
      toast('Нельзя удалить самого себя');
      return;
    }
    if (!confirm(`Удалить пользователя ${u.email} (${u.fullName})? Это действие нельзя отменить.`)) return;
    setUpdating(u.id);
    try {
      await focusClient.users.delete(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast('Пользователь удалён');
    } catch (err: unknown) {
      const data = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data : undefined;
      const raw = data?.message;
      const msg = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] ?? 'Не удалось удалить' : 'Не удалось удалить';
      toast(msg);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <Loader className="min-h-[40vh]" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Пользователи"
        actions={
          <Link href={ROUTES.kids.admin.register}>
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
                <th className="py-2 pr-4">Роль</th>
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
                      <select
                        value={u.role}
                        onChange={(e) => handleSetRole(u.id, e.target.value)}
                        disabled={updating === u.id}
                        className="rounded border border-primary/30 px-2 py-1 text-gray-800"
                      >
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    ) : (
                      ROLE_LABELS[u.role] ?? u.role
                    )}
                  </td>
                  <td className="py-2 pr-4">{u.hasKidsAccess ? 'Да' : 'Нет'}</td>
                  <td className="py-2">
                    <div className="flex flex-nowrap items-center gap-2">
                      <Button
                        variant="outline"
                        className="min-w-[7rem] shrink-0 text-sm"
                        onClick={() => handleKidsAccess(u.id, !u.hasKidsAccess)}
                        disabled={updating === u.id || u.role === 'admin' || u.role === 'moderator'}
                      >
                        {u.hasKidsAccess ? 'Забрать Kids' : 'Выдать Kids'}
                      </Button>
                      <Button
                        variant="outline"
                        className="min-w-[7rem] shrink-0 text-sm text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(u)}
                        disabled={updating === u.id || u.id === user?.id}
                        title={u.id === user?.id ? 'Нельзя удалить себя' : 'Удалить пользователя'}
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
    </div>
  );
}
