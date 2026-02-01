'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { kidsClient } from '@/lib/api/kids-client';
import { LecturePlayer } from '@/components/kids/LecturePlayer';
import { Loader } from '@/components/common/Loader';
import { ROUTES } from '@/lib/constants';
import type { Lecture } from '@/types/kids';

export default function LecturePage() {
  const params = useParams();
  const id = Number(params.id);
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    kidsClient.lectures.get(id).then((l) => {
      if (!cancelled) setLecture(l);
    }).catch(() => {
      if (!cancelled) setError('Лекция не найдена');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <Loader className="min-h-[40vh]" />;
  if (error || !lecture) return <p className="text-red-600">{error || 'Лекция не найдена'}</p>;

  return (
    <div className="space-y-6">
      <LecturePlayer
        lectureId={lecture.id}
        title={lecture.title}
        description={lecture.description}
      />
      <Link href={ROUTES.kids.learning} className="inline-block text-primary font-medium hover:underline">
        ← К обучению
      </Link>
    </div>
  );
}
