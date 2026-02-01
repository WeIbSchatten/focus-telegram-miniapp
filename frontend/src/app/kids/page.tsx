'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { kidsClient } from '@/lib/api/kids-client';
import { useKidsStore } from '@/store/kidsStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { PendingHomeworks } from '@/components/kids/PendingHomeworks';
import { ROUTES } from '@/lib/constants';
import { getKidsApiErrorMessage } from '@/lib/utils/apiError';
import type { Program, Group } from '@/types/kids';

export default function KidsHomePage() {
  const { user } = useAuth();
  const { role, studentId } = useKidsStore();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [progsRes, grpsRes] = await Promise.allSettled([
          kidsClient.programs.list(),
          kidsClient.groups.list(),
        ]);
        if (!cancelled) {
          setPrograms(progsRes.status === 'fulfilled' ? progsRes.value : []);
          setGroups(grpsRes.status === 'fulfilled' ? grpsRes.value : []);
          const err1 = progsRes.status === 'rejected' ? progsRes.reason : null;
          const err2 = grpsRes.status === 'rejected' ? grpsRes.reason : null;
          const msg =
            err1 && err2
              ? getKidsApiErrorMessage(err1)
              : err1
                ? getKidsApiErrorMessage(err1)
                : err2
                  ? getKidsApiErrorMessage(err2)
                  : '';
          setError(msg);
        }
      } catch (e) {
        if (!cancelled) setError(getKidsApiErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader className="min-h-[40vh]" />;

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800">
          {error}
        </div>
      )}
      <section>
        <h1 className="text-heading text-primary">Focus Kids</h1>
        <p className="mt-2 text-gray-700">
          Добро пожаловать, {user?.fullName}.
        </p>
      </section>

      {role === 'student' && studentId != null && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-primary">Текущие домашние задания</h2>
          <PendingHomeworks studentId={studentId} compact />
          <Link href={ROUTES.kids.lessons} className="mt-2 inline-block text-sm text-primary hover:underline">
            Все уроки и ДЗ →
          </Link>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold text-primary">Обучение</h2>
        <p className="mb-4 text-gray-600">
          Выберите группу и программу, чтобы перейти к лекциям, домашним заданиям и тестам.
        </p>
        {groups.length === 0 ? (
          <Card>
            <p className="text-gray-600">Пока нет доступных групп. Обратитесь к преподавателю.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((g) => (
              <Card key={g.id}>
                <h3 className="font-semibold text-primary">{g.name}</h3>
                <p className="mt-1 text-sm text-gray-600">Уровень: {g.level || '—'}</p>
                <Link href={ROUTES.kids.learning} className="mt-4 inline-block">
                  <Button variant="kids">К программе обучения</Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
