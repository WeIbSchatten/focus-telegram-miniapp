'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useKidsStore } from '@/store/kidsStore';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/lib/constants';
import { useNavigateAfterSuccess } from '@/lib/utils/navigation';
import type { Group } from '@/types/kids';

export default function CreateProgramPage() {
  const router = useRouter();
  const { show: toast } = useToast();
  const { role } = useKidsStore();
  const navigateAfterSuccess = useNavigateAfterSuccess(router);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [groupId, setGroupId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    let cancelled = false;
    kidsClient.groups.list().then((list) => {
      if (!cancelled) setGroups(list);
    }).catch(() => toast('Ошибка загрузки групп')).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !name.trim()) {
      toast('Укажите группу и название программы.');
      return;
    }
    setSaving(true);
    try {
      const created = await kidsClient.programs.create({
        group_id: Number(groupId),
        name: name.trim(),
        description: description.trim() || null,
      });
      toast('Программа создана.');
      navigateAfterSuccess(ROUTES.kids.learningProgram(created.id));
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : 'Ошибка сохранения';
      toast(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (role !== 'teacher') {
    return (
      <div className="space-y-6">
        <h1 className="text-heading text-primary">Создание программы обучения</h1>
        <Card>
          <p className="text-gray-700">Создавать программы могут только преподаватели, модераторы и администраторы.</p>
          <Link href={ROUTES.kids.learning} className="mt-4 inline-block text-primary font-medium hover:underline">
            ← К обучению
          </Link>
        </Card>
      </div>
    );
  }

  if (loading) return <Loader className="min-h-[40vh]" />;

  if (groups.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-heading text-primary">Создать программу обучения</h1>
        <Card>
          <p className="text-gray-700">Сначала создайте группу в разделе «Управление» → «Группы». Программа привязывается к группе.</p>
          <Link href={ROUTES.kids.learning} className="mt-4 inline-block text-primary font-medium hover:underline">
            ← К обучению
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-heading text-primary">Создать программу обучения</h1>
        <p className="mt-2 text-gray-700">
          Программа привязывается к группе. После создания вы сможете добавлять в неё лекции, домашние задания и тесты.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="mb-4 text-xl font-bold text-primary">Основные данные</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">Группа *</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-lg border-2 border-primary/30 px-3 py-2 focus:border-primary focus:outline-none"
                required
              >
                <option value="">Выберите группу</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                    {g.level ? ` (${g.level})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Название программы *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Beginner A1"
              required
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">Описание (необязательно)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] w-full rounded-lg border-2 border-primary/30 px-3 py-2 focus:border-primary focus:outline-none"
                placeholder="Краткое описание программы обучения"
                rows={4}
              />
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap gap-4">
          <Button type="submit" variant="kids" loading={saving}>
            Создать программу
          </Button>
          <Link href={ROUTES.kids.learning}>
            <Button type="button" variant="ghost">
              Отмена
            </Button>
          </Link>
        </div>
      </form>

      <Link href={ROUTES.kids.learning} className="inline-block text-primary font-medium hover:underline">
        ← К обучению
      </Link>
    </div>
  );
}
