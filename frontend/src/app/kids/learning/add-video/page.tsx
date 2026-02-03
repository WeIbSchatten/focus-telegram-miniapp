'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useKidsStore } from '@/store/kidsStore';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/layout/PageHeader';
import { ROUTES } from '@/lib/constants';
import type { ProgramWithCounts } from '@/types/kids';

export default function AddVideoPage() {
  const { role, studentId } = useKidsStore();
  const [programs, setPrograms] = useState<ProgramWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const listWithCounts = await kidsClient.programs.listWithCounts();
        if (cancelled) return;
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
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [role, studentId]);

  if (loading) return <Loader className="min-h-[40vh]" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Добавить видео"
        description="Выберите программу, к которой хотите добавить или изменить видео."
      />
      {programs.length === 0 ? (
        <Card>
          <p className="text-gray-700">Нет доступных программ.</p>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((prog) => (
            <li key={prog.id}>
              <Link href={ROUTES.kids.learningProgramVideos(prog.id)}>
                <Card className="cursor-pointer transition hover:border-primary/50 h-full">
                  <h2 className="font-semibold text-primary">{prog.name}</h2>
                  {prog.description && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{prog.description}</p>
                  )}
                  <div className="mt-3">
                    <Button variant="outline" className="min-h-[2.5rem] min-w-[10rem] w-full text-sm sm:w-auto">
                      Добавить или изменить видео
                    </Button>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href={ROUTES.kids.learning} className="inline-block text-primary font-medium hover:underline">
        ← К обучению
      </Link>
    </div>
  );
}
