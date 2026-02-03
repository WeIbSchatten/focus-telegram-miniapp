'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useKidsStore } from '@/store/kidsStore';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/lib/constants';
import { useNavigateAfterSuccess } from '@/lib/utils/navigation';
import type { Program } from '@/types/kids';

export default function EditProgramPage() {
  const params = useParams();
  const router = useRouter();
  const programId = Number(params.programId);
  const { user } = useAuth();
  const { role } = useKidsStore();
  const { show: toast } = useToast();
  const navigateAfterSuccess = useNavigateAfterSuccess(router);
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const canEdit = role === 'teacher' || user?.roles?.includes('admin') || user?.roles?.includes('moderator');

  useEffect(() => {
    if (!programId || Number.isNaN(programId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    kidsClient.programs.get(programId).then((p) => {
      if (!cancelled) {
        setProgram(p);
        setName(p.name);
        setDescription(p.description ?? '');
      }
    }).catch(() => {
      if (!cancelled) toast('Программа не найдена');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [programId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Укажите название программы.');
      return;
    }
    setSaving(true);
    try {
      await kidsClient.programs.update(programId, {
        name: name.trim(),
        description: description.trim() || null,
      });
      toast('Программа сохранена.');
      navigateAfterSuccess(ROUTES.kids.learningProgram(programId));
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string | string[] } } }).response?.data?.detail
        : 'Ошибка сохранения';
      toast(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <h1 className="text-heading text-primary">Редактирование программы</h1>
        <Card>
          <p className="text-gray-700">Редактировать программу могут только преподаватели, модераторы и администраторы.</p>
          <Link href={ROUTES.kids.learning} className="mt-4 inline-block text-primary font-medium hover:underline">
            ← К обучению
          </Link>
        </Card>
      </div>
    );
  }

  if (loading) return <Loader className="min-h-[40vh]" />;
  if (!program) return <p className="text-red-600">Программа не найдена.</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-heading text-primary">Редактировать программу</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <Input
            label="Название программы"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название программы"
            required
          />
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-800">Описание (необязательно)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] w-full rounded-lg border-2 border-primary/30 px-3 py-2 focus:border-primary focus:outline-none"
              placeholder="Описание программы"
              rows={4}
            />
          </div>
        </Card>
        <div className="flex flex-wrap gap-4">
          <Button type="submit" variant="kids" loading={saving}>
            Сохранить
          </Button>
          <Link href={ROUTES.kids.learningProgram(programId)}>
            <Button type="button" variant="ghost">Отмена</Button>
          </Link>
        </div>
      </form>
      <Link href={ROUTES.kids.learning} className="inline-block text-primary font-medium hover:underline">
        ← К обучению
      </Link>
    </div>
  );
}
