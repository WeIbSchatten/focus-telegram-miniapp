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
import type { Test } from '@/types/kids';

export default function EditTestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = Number(params.testId);
  const { user } = useAuth();
  const { role } = useKidsStore();
  const { show: toast } = useToast();
  const navigateAfterSuccess = useNavigateAfterSuccess(router);
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxAttempts, setMaxAttempts] = useState<string>('');

  const canEdit = role === 'teacher' || user?.roles?.includes('admin') || user?.roles?.includes('moderator');

  useEffect(() => {
    if (!testId || Number.isNaN(testId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    kidsClient.tests.get(testId).then((t) => {
      if (!cancelled) {
        setTest(t);
        setTitle(t.title);
        setDescription(t.description ?? '');
        setMaxAttempts(t.max_attempts == null ? '' : String(t.max_attempts));
      }
    }).catch(() => {
      if (!cancelled) toast('Тест не найден');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [testId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast('Укажите название теста.');
      return;
    }
    setSaving(true);
    try {
      await kidsClient.tests.update(testId, {
        title: title.trim(),
        description: description.trim() || null,
        max_attempts: maxAttempts === '' ? null : Math.max(0, parseInt(maxAttempts, 10) || 0),
      });
      toast('Тест сохранён.');
      navigateAfterSuccess(ROUTES.kids.test(testId));
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
        <h1 className="text-heading text-primary">Редактирование теста</h1>
        <Card>
          <p className="text-gray-700">Редактировать тест могут только преподаватели, модераторы и администраторы.</p>
          <Link href={ROUTES.kids.learning} className="mt-4 inline-block text-primary font-medium hover:underline">
            ← К обучению
          </Link>
        </Card>
      </div>
    );
  }

  if (loading) return <Loader className="min-h-[40vh]" />;
  if (!test) return <p className="text-red-600">Тест не найден.</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-heading text-primary">Редактировать тест</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <Input
            label="Название теста"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название теста"
            required
          />
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-800">Описание (необязательно)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] w-full rounded-lg border-2 border-primary/30 px-3 py-2 focus:border-primary focus:outline-none"
              placeholder="Описание теста"
              rows={3}
            />
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-800">Макс. попыток (пусто = неограниченно)</label>
            <input
              type="number"
              min={0}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
              className="w-full rounded-lg border-2 border-primary/30 px-3 py-2 focus:border-primary focus:outline-none"
              placeholder="Неограниченно"
            />
          </div>
        </Card>
        <div className="flex flex-wrap gap-4">
          <Button type="submit" variant="kids" loading={saving}>
            Сохранить
          </Button>
          <Link href={ROUTES.kids.test(testId)}>
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
