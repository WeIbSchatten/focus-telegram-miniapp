'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { kidsClient } from '@/lib/api/kids-client';
import { focusClient } from '@/lib/api/focus-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/lib/constants';

type TeacherRow = { id: number; full_name: string; focus_user_id: string };

export default function AdminTeachersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { show: toast } = useToast();
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [focusUsers, setFocusUsers] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formFullName, setFormFullName] = useState('');
  const [formFocusUserId, setFormFocusUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'moderator') {
      router.push(ROUTES.kids.root);
      return;
    }
    let cancelled = false;
    Promise.all([kidsClient.teachers.list(), focusClient.users.list()]).then(([t, fu]) => {
      if (!cancelled) {
        setTeachers(t);
        setFocusUsers(fu.map((u) => ({ id: u.id, fullName: u.fullName, email: u.email })));
      }
    }).catch(() => toast('Не удалось загрузить данные')).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.role, router, toast]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim() || !formFocusUserId.trim()) {
      toast('Заполните ФИО и выберите пользователя');
      return;
    }
    setSubmitting(true);
    try {
      const created = await kidsClient.teachers.create({
        full_name: formFullName.trim(),
        focus_user_id: formFocusUserId,
      });
      setTeachers((prev) => [...prev, created]);
      setModalOpen(false);
      setFormFullName('');
      setFormFocusUserId('');
      toast('Преподаватель добавлен');
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-heading text-primary">Преподаватели</h1>
        <Button variant="kids" onClick={() => setModalOpen(true)}>Добавить преподавателя</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/20 text-left text-gray-700">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">ФИО</th>
                <th className="py-2 pr-4">Focus User ID</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 text-gray-800">
                  <td className="py-2 pr-4">{t.id}</td>
                  <td className="py-2 pr-4">{t.full_name}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{t.focus_user_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Добавить преподавателя">
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
          <Button type="submit" variant="kids" loading={submitting}>Добавить</Button>
        </form>
      </Modal>
    </div>
  );
}
