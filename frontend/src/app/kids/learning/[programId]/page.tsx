'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { PAGE_ACTION_BUTTON_CLASS } from '@/components/layout/PageHeader';
import { ROUTES } from '@/lib/constants';
import { useKidsStore } from '@/store/kidsStore';
import type { Program } from '@/types/kids';

export default function ProgramPage() {
  const params = useParams();
  const programId = Number(params.programId);
  const { user } = useAuth();
  const { role } = useKidsStore();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!programId || Number.isNaN(programId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    kidsClient.programs.get(programId).then((p) => {
      if (!cancelled) setProgram(p);
    }).catch(() => {
      if (!cancelled) setError('Программа не найдена');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [programId]);

  if (loading) return <Loader className="min-h-[40vh]" />;
  if (error || !program) return <p className="text-red-600">{error || 'Программа не найдена'}</p>;

  const lectures = program.lectures ?? [];
  const homeworks = program.homeworks ?? [];
  const tests = program.tests ?? [];
  const canEditVideos = role === 'teacher' || user?.role === 'admin' || user?.role === 'moderator';

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-heading text-primary">{program.name}</h1>
        {program.description && (
          <p className="mt-2 text-gray-700">{program.description}</p>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-primary">Видео по темам — всего: {lectures.length}</h2>
          {canEditVideos && (
            <Link href={ROUTES.kids.learningProgramVideos(programId)}>
              <Button variant="outline" className={PAGE_ACTION_BUTTON_CLASS}>Добавить видео</Button>
            </Link>
          )}
        </div>
        {lectures.length > 0 ? (
          <ul className="space-y-2">
            {lectures.map((l) => (
              <li key={l.id}>
                <Link href={ROUTES.kids.lecture(l.id)}>
                  <Card className="cursor-pointer transition hover:border-primary/50">
                    <span className="font-medium text-primary">{l.title}</span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Card>
            <p className="text-gray-700">Пока нет видео. {canEditVideos && 'Нажмите «Добавить видео», чтобы добавить ссылки на YouTube, VK Video или RuTube.'}</p>
          </Card>
        )}
      </section>

      {homeworks.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-primary">Домашние задания — всего по программе: {homeworks.length}</h2>
          <ul className="space-y-2">
            {homeworks.map((h) => (
              <li key={h.id}>
                <Link href={ROUTES.kids.homework(h.id)}>
                  <Button variant="kids">{h.title}</Button>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tests.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-primary">Блестнуть знаниями (тесты)</h2>
          <ul className="space-y-2">
            {tests.map((t) => (
              <li key={t.id}>
                <Link href={ROUTES.kids.test(t.id)}>
                  <Button variant="outline">{t.title}</Button>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href={ROUTES.kids.learning} className="inline-block text-primary font-medium hover:underline">
        ← К списку программ
      </Link>
    </div>
  );
}
