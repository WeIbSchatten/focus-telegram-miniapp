'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { PageHeader, PAGE_ACTION_BUTTON_CLASS } from '@/components/layout/PageHeader';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/lib/constants';
import { getKidsApiErrorMessage } from '@/lib/utils/apiError';
import type { Group } from '@/types/kids';

export default function AdminGroupsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { show: toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<{ id: number; full_name: string }[]>([]);
  const [students, setStudents] = useState<{ id: number; full_name: string; group_id?: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formLevel, setFormLevel] = useState('');
  const [formTeacherId, setFormTeacherId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [assignModal, setAssignModal] = useState<{ groupId: number; groupName: string } | null>(null);
  const [assignStudentId, setAssignStudentId] = useState<number | ''>('');
  const [assigning, setAssigning] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'moderator') {
      router.push(ROUTES.kids.root);
      return;
    }
    let cancelled = false;
    Promise.all([
      kidsClient.groups.list(),
      kidsClient.teachers.list(),
      kidsClient.students.list(),
    ]).then(([gr, t, st]) => {
      if (!cancelled) {
        setGroups(gr);
        setTeachers(t);
        setStudents(st);
        setLoadError('');
      }
    }).catch((err) => {
      if (!cancelled) {
        const msg = getKidsApiErrorMessage(err);
        setLoadError(msg);
        toast(msg);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.role, router, toast]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast('Введите название группы');
      return;
    }
    setSubmitting(true);
    try {
      const created = await kidsClient.groups.create({
        name: formName.trim(),
        level: formLevel.trim() || undefined,
        teacher_id: formTeacherId === '' ? undefined : Number(formTeacherId),
      });
      setGroups((prev) => [...prev, created]);
      setModalOpen(false);
      setFormName('');
      setFormLevel('');
      setFormTeacherId('');
      toast('Группа создана');
    } catch (err: unknown) {
      toast(getKidsApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModal || assignStudentId === '') return;
    setAssigning(true);
    try {
      await kidsClient.groups.assignStudent(assignModal.groupId, Number(assignStudentId));
      const [gr, st] = await Promise.all([kidsClient.groups.list(), kidsClient.students.list()]);
      setGroups(gr);
      setStudents(st);
      setAssignModal(null);
      setAssignStudentId('');
      toast('Ученик привязан к группе');
    } catch (err: unknown) {
      toast(getKidsApiErrorMessage(err));
    } finally {
      setAssigning(false);
    }
  };

  if (loading && !loadError) return <Loader className="min-h-[40vh]" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Группы"
        actions={
          <Button variant="outline" className={PAGE_ACTION_BUTTON_CLASS} onClick={() => setModalOpen(true)}>
            Создать группу
          </Button>
        }
      />

      {loadError && (
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
          <p className="font-medium">Не удалось загрузить данные</p>
          <p className="mt-1 text-sm">{loadError}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((g) => (
          <Card key={g.id}>
            <h3 className="font-semibold text-primary">{g.name}</h3>
            <p className="mt-1 text-sm text-gray-700">Уровень: {g.level ?? '—'}</p>
            <p className="text-sm text-gray-700">Преподаватель: {g.teacher?.full_name ?? '—'}</p>
            <p className="text-sm text-gray-700">Учеников: {g.students?.length ?? 0}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={ROUTES.kids.admin.groupEdit(g.id)}>
                <Button variant="outline" className="min-h-[2.5rem] min-w-[8rem] text-sm">
                  Редактировать
                </Button>
              </Link>
              <Button
                variant="outline"
                className="min-h-[2.5rem] min-w-[8rem] text-sm"
                onClick={() => setAssignModal({ groupId: g.id, groupName: g.name })}
              >
                Привязать ученика
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Создать группу">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Название" value={formName} onChange={(e) => setFormName(e.target.value)} required />
          <Input label="Уровень" value={formLevel} onChange={(e) => setFormLevel(e.target.value)} placeholder="A1, B2..." />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">Преподаватель</label>
            <select
              value={formTeacherId}
              onChange={(e) => setFormTeacherId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-lg border-2 border-primary/30 px-3 py-2 text-gray-900"
            >
              <option value="">Без преподавателя</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="kids" loading={submitting}>Создать</Button>
        </form>
      </Modal>

      {assignModal && (
        <Modal isOpen={!!assignModal} onClose={() => setAssignModal(null)} title={`Привязать ученика к группе «${assignModal.groupName}»`}>
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">Ученик</label>
              <select
                value={assignStudentId}
                onChange={(e) => setAssignStudentId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border-2 border-primary/30 px-3 py-2 text-gray-900"
                required
              >
                <option value="">Выберите ученика</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="kids" loading={assigning}>Привязать</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
