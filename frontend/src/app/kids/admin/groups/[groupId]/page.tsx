'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { PageHeader, PAGE_ACTION_BUTTON_CLASS } from '@/components/layout/PageHeader';
import { Loader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/lib/constants';
import { useNavigateAfterSuccess } from '@/lib/utils/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { Group, Student } from '@/types/kids';

export default function AdminGroupEditPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = Number(params.groupId);
  const { user } = useAuth();
  const { show: toast } = useToast();
  const navigateAfterSuccess = useNavigateAfterSuccess(router);
  const [group, setGroup] = useState<Group | null>(null);
  const [teachers, setTeachers] = useState<{ id: number; full_name: string }[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignStudentId, setAssignStudentId] = useState<number | ''>('');
  const [assigning, setAssigning] = useState(false);

  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [teacherId, setTeacherId] = useState<number | ''>('');

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'moderator') {
      router.push(ROUTES.kids.root);
      return;
    }
    if (!groupId || Number.isNaN(groupId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([
      kidsClient.groups.get(groupId),
      kidsClient.teachers.list(),
      kidsClient.students.list(),
    ]).then(([g, t, st]) => {
      if (!cancelled) {
        setGroup(g);
        setName(g.name);
        setLevel(g.level ?? '');
        setTeacherId(g.teacher_id ?? '');
        setTeachers(t);
        setAllStudents(st);
      }
    }).catch(() => {
      if (!cancelled) toast('Группа не найдена');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [groupId, user?.role, router, toast]);

  const handleSaveData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;
    setSaving(true);
    try {
      await kidsClient.groups.update(groupId, {
        name: name.trim(),
        level: level.trim() || undefined,
        teacher_id: teacherId === '' ? undefined : Number(teacherId),
      });
      toast('Данные группы успешно сохранены.');
      navigateAfterSuccess(ROUTES.kids.admin.groups);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'Ошибка сохранения';
      toast(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (assignStudentId === '') return;
    setAssigning(true);
    try {
      const updated = await kidsClient.groups.assignStudent(groupId, Number(assignStudentId));
      setGroup(updated);
      const st = await kidsClient.students.list();
      setAllStudents(st);
      setAssignModalOpen(false);
      setAssignStudentId('');
      toast('Ученик добавлен в группу');
    } catch {
      toast('Ошибка при добавлении');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (studentId: number) => {
    if (!confirm('Убрать ученика из этой группы?')) return;
    try {
      const updated = await kidsClient.groups.unassignStudent(groupId, studentId);
      setGroup(updated);
      const st = await kidsClient.students.list();
      setAllStudents(st);
      toast('Ученик убран из группы');
    } catch {
      toast('Ошибка');
    }
  };

  const studentsInGroup = group?.students ?? [];
  const studentsNotInGroup = allStudents.filter((s) => s.group_id !== groupId);

  if (loading) return <Loader className="min-h-[40vh]" />;
  if (!group) return <p className="text-red-600">Группа не найдена.</p>;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Редактирование группы"
        actions={
          <Link href={ROUTES.kids.admin.groups}>
            <Button variant="outline" className={PAGE_ACTION_BUTTON_CLASS}>← К списку групп</Button>
          </Link>
        }
      />

      <Card>
        <h2 className="mb-4 text-xl font-bold text-primary">Данные группы</h2>
        <form onSubmit={handleSaveData} className="space-y-4">
          <Input
            label="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Уровень"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="A1, B2..."
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">Преподаватель</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-lg border-2 border-primary/30 px-3 py-2 text-gray-900"
            >
              <option value="">Без преподавателя</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="kids" loading={saving}>Сохранить</Button>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-primary">Ученики в группе ({studentsInGroup.length})</h2>
          <Button variant="outline" className={PAGE_ACTION_BUTTON_CLASS} onClick={() => setAssignModalOpen(true)}>
            Добавить ученика
          </Button>
        </div>
        {studentsInGroup.length === 0 ? (
          <p className="text-gray-700">В группе пока нет учеников. Нажмите «Добавить ученика».</p>
        ) : (
          <ul className="space-y-2">
            {studentsInGroup.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 px-3 py-2">
                <span className="font-medium text-gray-800">{s.full_name}</span>
                <Button
                  variant="ghost"
                  className="text-sm text-red-600 hover:bg-red-50"
                  onClick={() => handleUnassign(s.id)}
                >
                  Убрать из группы
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        isOpen={assignModalOpen}
        onClose={() => { setAssignModalOpen(false); setAssignStudentId(''); }}
        title="Добавить ученика в группу"
      >
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
              {studentsNotInGroup.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
            {studentsNotInGroup.length === 0 && (
              <p className="mt-1 text-sm text-gray-600">Все ученики уже привязаны к группам.</p>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => setAssignModalOpen(false)}>Отмена</Button>
            <Button type="submit" variant="kids" loading={assigning} disabled={studentsNotInGroup.length === 0}>
              Добавить
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
