'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useKidsStore } from '@/store/kidsStore';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { HomeworkForm } from '@/components/kids/HomeworkForm';
import { HomeworkSubmissionsList } from '@/components/kids/HomeworkSubmissionsList';
import { Loader } from '@/components/common/Loader';
import { ROUTES } from '@/lib/constants';
import type { Homework, HomeworkSubmission } from '@/types/kids';

export default function HomeworkPage() {
  const params = useParams();
  const id = Number(params.id);
  const { role, studentId } = useKidsStore();
  const [homework, setHomework] = useState<Homework | null>(null);
  const [submission, setSubmission] = useState<HomeworkSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    kidsClient.homeworks.get(id).then((h) => {
      if (!cancelled) setHomework(h);
    }).catch(() => {
      if (!cancelled) setError('Домашнее задание не найдено');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!studentId || !id) return;
    let cancelled = false;
    kidsClient.homeworks.submissions.listByStudent(studentId).then((list) => {
      const sub = list.find((s) => s.homework_id === id);
      if (!cancelled) setSubmission(sub ?? null);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [studentId, id]);

  if (loading) return <Loader className="min-h-[40vh]" />;
  if (error || !homework) return <p className="text-red-600">{error || 'Домашнее задание не найдено'}</p>;

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-heading text-primary">{homework.title}</h1>
        {homework.description && (
          <p className="mt-2 text-gray-700">{homework.description}</p>
        )}
        {homework.files?.length > 0 && (
          <ul className="mt-4 space-y-1">
            {homework.files.map((f) => (
              <li key={f.id}>
                <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {f.file_name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {role === 'student' && (
        <HomeworkForm
          homework={homework}
          existingSubmission={submission ? { id: submission.id, answer_text: submission.answer_text } : null}
        />
      )}

      {role === 'teacher' && (
        <HomeworkSubmissionsList homework={homework} />
      )}

      <Link href={ROUTES.kids.learning} className="inline-block text-primary font-medium hover:underline">
        ← К обучению
      </Link>
    </div>
  );
}
