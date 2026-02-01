'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { kidsClient } from '@/lib/api/kids-client';
import { TestComponent } from '@/components/kids/TestComponent';
import { TestSubmissionsList } from '@/components/kids/TestSubmissionsList';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { ROUTES } from '@/lib/constants';
import { useKidsStore } from '@/store/kidsStore';
import type { Test } from '@/types/kids';

export default function TestPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user } = useAuth();
  const { role, studentId } = useKidsStore();
  const canEdit = role === 'teacher' || user?.role === 'admin' || user?.role === 'moderator';
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    kidsClient.tests.get(id).then((t) => {
      if (!cancelled) setTest(t);
    }).catch(() => {
      if (!cancelled) setError('Тест не найден');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <Loader className="min-h-[40vh]" />;
  if (error || !test) return <p className="text-red-600">{error || 'Тест не найден'}</p>;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-heading text-primary">{test.title}</h1>
            {test.description && (
              <p className="mt-2 text-gray-700">{test.description}</p>
            )}
          </div>
          {canEdit && (
            <Link href={ROUTES.kids.editTest(test.id)}>
              <Button variant="outline" className="text-sm">Изменить</Button>
            </Link>
          )}
        </div>
      </Card>

      {role === 'student' && <TestComponent test={test} />}
      {role === 'teacher' && (
        <TestSubmissionsList test={test} />
      )}

      <Link href={ROUTES.kids.learning} className="inline-block text-primary font-medium hover:underline">
        ← К обучению
      </Link>
    </div>
  );
}
