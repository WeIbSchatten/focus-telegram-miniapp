'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useKidsStore } from '@/store/kidsStore';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { ROUTES } from '@/lib/constants';
import type { Program, ProgramWithCounts, Group } from '@/types/kids';

/** Количество занятий/ДЗ/тестов/видео: приоритет у длин массивов из полной программы (get), иначе *_count из with-counts. */
function lessonsCount(prog: Program | ProgramWithCounts): number {
  if ('lessons_count' in prog && typeof prog.lessons_count === 'number') return prog.lessons_count;
  return 0;
}
function lecturesCount(prog: Program | ProgramWithCounts): number {
  const fromArray = Array.isArray(prog.lectures) ? prog.lectures.length : 0;
  const fromCount = 'lectures_count' in prog && typeof prog.lectures_count === 'number' ? prog.lectures_count : 0;
  return Math.max(fromArray, fromCount);
}
function testsCount(prog: Program | ProgramWithCounts): number {
  const fromArray = Array.isArray(prog.tests) ? prog.tests.length : 0;
  const fromCount = 'tests_count' in prog && typeof prog.tests_count === 'number' ? prog.tests_count : 0;
  return Math.max(fromArray, fromCount);
}

export default function LearningPage() {
  const { user } = useAuth();
  const { role, studentId } = useKidsStore();
  const [programs, setPrograms] = useState<(Program | ProgramWithCounts)[]>([]);
  const canEdit = role === 'teacher' || user?.role === 'admin' || user?.role === 'moderator';
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [listWithCounts, grps] = await Promise.all([
          kidsClient.programs.listWithCounts(),
          kidsClient.groups.list(),
        ]);
        if (cancelled) return;
        setGroups(grps);
        let list = listWithCounts;
        if (role === 'student' && studentId) {
          try {
            const student = await kidsClient.students.get(studentId);
            if (student.group_id) {
              list = listWithCounts.filter((p) => p.group_id === student.group_id);
            }
          } catch {
            list = listWithCounts;
          }
        }
        setPrograms(list);
        if (list.length === 0) {
          setLoading(false);
          return;
        }
        const results = await Promise.allSettled(
          list.map((p) => kidsClient.programs.get(p.id))
        );
        if (cancelled) return;
        setPrograms((prev) =>
          prev.map((prog, i) => {
            const r = results[i];
            if (r.status === 'fulfilled') {
              const full = r.value;
              const withCounts = prog as ProgramWithCounts;
              // Счётчики: максимум из полной программы (get) и with-counts, чтобы при пустом массиве из get не терять корректный count
              const lecturesCountVal = Math.max(full.lectures?.length ?? 0, withCounts.lectures_count ?? 0);
              const testsCountVal = Math.max(full.tests?.length ?? 0, withCounts.tests_count ?? 0);
              const lessonsCountVal = withCounts.lessons_count ?? 0;
              return {
                ...full,
                lectures: full.lectures,
                homeworks: full.homeworks,
                tests: full.tests,
                lectures_count: lecturesCountVal,
                tests_count: testsCountVal,
                lessons_count: lessonsCountVal,
              };
            }
            return prog;
          })
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [role, studentId]);

  if (loading) return <Loader className="min-h-[40vh]" />;

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-heading text-primary">Обучение</h1>
          </div>
          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <Link href={ROUTES.kids.createProgram}>
                <Button variant="outline">Создать программу</Button>
              </Link>
              <Link href={ROUTES.kids.addVideo}>
                <Button variant="outline">Добавить видео</Button>
              </Link>
              <Link href={ROUTES.kids.createTest}>
                <Button variant="kids">Создать тест</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {programs.length === 0 ? (
        <Card>
          <p className="text-gray-700">Пока нет программ. Обратитесь к преподавателю.</p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((prog) => (
            <Card key={prog.id} variant="kids">
              <h2 className="text-xl font-bold text-primary">{prog.name}</h2>
              {prog.description && (
                <p className="mt-2 text-sm text-gray-700 line-clamp-2">{prog.description}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-sm text-primary">
                  Занятий проведено: {lessonsCount(prog)}
                </span>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-sm text-primary">
                  Видео: {lecturesCount(prog)}
                </span>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-sm text-primary">
                  Тестов: {testsCount(prog)}
                </span>
              </div>
              {lecturesCount(prog) > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-semibold text-primary">Видео по темам</h3>
                  <div className="flex flex-wrap gap-2">
                    {prog.lectures?.map((l) => (
                      <Link key={l.id} href={ROUTES.kids.lecture(l.id)}>
                        <Button variant="ghost" className="text-sm">
                          {l.title}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {testsCount(prog) > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-semibold text-primary">Блестнуть знаниями (тесты)</h3>
                  <div className="flex flex-wrap gap-2">
                    {prog.tests?.map((t) => (
                      <Link key={t.id} href={ROUTES.kids.test(t.id)}>
                        <Button variant="outline" className="text-sm">
                          {t.title}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {canEdit && (
                <div className="mt-4 pt-4 border-t border-primary/10">
                  <Link href={ROUTES.kids.editProgram(prog.id)}>
                    <Button variant="outline" className="text-sm w-full sm:w-auto">Изменить программу</Button>
                  </Link>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
