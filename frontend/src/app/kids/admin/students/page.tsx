'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { kidsClient } from '@/lib/api/kids-client';
import { focusClient } from '@/lib/api/focus-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { PageHeader, PAGE_ACTION_BUTTON_CLASS } from '@/components/layout/PageHeader';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/lib/constants';
import type { Student } from '@/types/kids';

export default function AdminStudentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { show: toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [focusUsers, setFocusUsers] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formFullName, setFormFullName] = useState('');
  const [formFocusUserId, setFormFocusUserId] = useState('');
  const [formGroupId, setFormGroupId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.roles?.includes('admin') && !user?.roles?.includes('moderator')) {
      router.push(ROUTES.kids.root);
      return;
    }
    let cancelled = false;
    Promise.all([
      kidsClient.students.list(),
      focusClient.users.list(),
      kidsClient.groups.list(),
    ]).then(([st, fu, gr]) => {
      if (!cancelled) {
        setStudents(st);
        setFocusUsers(fu.map((u) => ({ id: u.id, fullName: u.fullName, email: u.email })));
        setGroups(gr.map((g) => ({ id: g.id, name: g.name })));
      }
    }).catch(() => toast('Не удалось загрузить данные')).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.roles, router, toast]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim() || !formFocusUserId.trim()) {
      toast('Заполните ФИО и выберите пользователя');
      return;
    }
    setSubmitting(true);
    try {
      const created = await kidsClient.students.create({
        full_name: formFullName.trim(),
        focus_user_id: formFocusUserId,
        group_id: formGroupId === '' ? undefined : Number(formGroupId),
      });
      setStudents((prev) => [...prev, created]);
      setModalOpen(false);
      setFormFullName('');
      setFormFocusUserId('');
      setFormGroupId('');
      toast('Ученик добавлен');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'Ошибка создания';
      toast(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader className="min-h-[40vh]" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ученики"
        actions={
          <Button variant="outline" className={PAGE_ACTION_BUTTON_CLASS} onClick={() => setModalOpen(true)}>
            Добавить ученика
          </Button>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/20 text-left text-gray-700">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">ФИО</th>
                <th className="py-2 pr-4">Focus User ID</th>
                <th className="py-2 pr-4">Группа</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 text-gray-800">
                  <td className="py-2 pr-4">{s.id}</td>
                  <td className="py-2 pr-4">{s.full_name}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{s.focus_user_id}</td>
                  <td className="py-2 pr-4">{s.group_id ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Добавить ученика">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="ФИО" value={formFullName} onChange={(e) => setFormFullName(e.target.value)} required />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">Пользователь Focus</label>
            <select
              value={formFocusUserId}
              onChange={(e) => setFormFocusUserId(e.target.value)}
              className="w-full rounded-lg border-2 border-primary/30 px-3 py-2 text-gray-900"
              required
            >
              <option value="">Выберите пользователя</option>
              {focusUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">Группа</label>
            <select
              value={formGroupId}
              onChange={(e) => setFormGroupId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-lg border-2 border-primary/30 px-3 py-2 text-gray-900"
            >
              <option value="">Без группы</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="kids" loading={submitting}>Добавить</Button>
        </form>
      </Modal>
    </div>
  );
}
