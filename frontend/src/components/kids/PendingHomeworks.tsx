'use client';

import { useEffect, useState } from 'react';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Loader } from '@/components/common/Loader';
import { formatDate } from '@/lib/utils/date';
import { getPendingHomeworks } from '@/lib/utils/pendingHomeworks';
import type { Grade } from '@/types/kids';

interface AttendanceRecord {
  lesson_date: string;
}

interface PendingHomeworksProps {
  studentId: number;
  /** Компактный вид (например, на главной) */
  compact?: boolean;
}

/**
 * Показывает ученику текущие ДЗ: все «ДЗ на следующий урок», за которые
 * ещё не поставлена оценка на следующем занятии (oral_hw / written_hw).
 * Если на следующем уроке оценки нет — ДЗ считается невыполненным и остаётся в списке.
 */
export function PendingHomeworks({ studentId, compact }: PendingHomeworksProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      kidsClient.attendance.listByStudent(studentId),
      kidsClient.grades.listByStudent(studentId),
    ]).then(([att, gr]) => {
      if (!cancelled) {
        setAttendance(att);
        setGrades(gr);
      }
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [studentId]);

  if (loading) return <Loader className="min-h-[60px]" />;

  const pending = getPendingHomeworks(attendance, grades);

  if (pending.length === 0) {
    return (
      <Card variant="kids">
        <h3 className="font-semibold text-primary">Текущие домашние задания</h3>
        <p className="mt-2 text-gray-600">Нет заданий, ожидающих выполнения. Новые ДЗ появятся после занятий.</p>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card variant="kids">
        <h3 className="font-semibold text-primary">Текущие домашние задания ({pending.length})</h3>
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          {pending.slice(0, 3).map((g) => (
            <li key={g.id}>
              <span className="text-gray-500">{formatDate(g.lesson_date!)}:</span> {g.comment?.slice(0, 60)}{g.comment && g.comment.length > 60 ? '…' : ''}
            </li>
          ))}
          {pending.length > 3 && <li className="text-primary">… и ещё {pending.length - 3}</li>}
        </ul>
      </Card>
    );
  }

  return (
    <Card variant="kids">
      <h3 className="font-semibold text-primary">Текущие домашние задания</h3>
      <p className="mt-1 text-sm text-gray-600">
        Задания отображаются до тех пор, пока на следующем уроке за них не поставят оценку (ДЗ устное / письменное).
      </p>
      <ul className="mt-4 space-y-3">
        {pending.map((g) => (
          <li key={g.id} className="rounded-lg border border-primary/20 bg-white p-3">
            <p className="text-xs text-gray-500">Задано на занятии {formatDate(g.lesson_date!)}</p>
            <p className="mt-1 text-gray-800">{g.comment ?? ''}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
