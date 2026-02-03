'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { senseClient } from '@/lib/api/sense-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { ROUTES } from '@/lib/constants';
import type { WeeklyIntention, DailyQuestion } from '@/types/sense';

export default function SenseHomePage() {
  const { user } = useAuth();
  const [weeklyIntention, setWeeklyIntention] = useState<WeeklyIntention | null>(null);
  const [dailyQuestion, setDailyQuestion] = useState<DailyQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      senseClient.content.weeklyIntention(),
      senseClient.content.dailyQuestion(),
    ])
      .then(([intention, question]) => {
        if (!cancelled) {
          setWeeklyIntention(intention ?? null);
          setDailyQuestion(question ?? null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.detail || 'Ошибка загрузки');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
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
        <h1 className="text-heading text-sense">Focus Sense</h1>
        <p className="mt-2 text-gray-700">
          Медитация и личностный рост. Добро пожаловать, {user?.fullName}.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card variant="sense" className="bg-sense/5">
          <h2 className="text-lg font-bold text-sense">Установка на неделю</h2>
          <p className="mt-2 text-gray-700">
            {weeklyIntention?.text ?? 'Пока нет установки. Обновляется в понедельник в 00:00.'}
          </p>
        </Card>
        <Card variant="sense" className="bg-sense/5">
          <h2 className="text-lg font-bold text-sense">Вопрос дня</h2>
          <p className="mt-2 text-gray-700">
            {dailyQuestion?.text ?? 'Пока нет вопроса. Обновляется каждый день в 00:00.'}
          </p>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-sense">Практики</h2>
        <p className="mb-4 text-gray-600">
          Аудиомедитации и аффирмации на ходу для развития эмоционального интеллекта.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href={ROUTES.sense.meditations} className="inline-block no-underline hover:no-underline">
            <Button variant="sense">Медитации</Button>
          </Link>
          <Link href={ROUTES.sense.affirmations} className="inline-block no-underline hover:no-underline">
            <Button variant="sense">Аффирмации на ходу</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
