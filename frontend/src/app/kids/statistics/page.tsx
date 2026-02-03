'use client';

import { useEffect, useState } from 'react';
import { useKidsStore } from '@/store/kidsStore';
import { kidsClient } from '@/lib/api/kids-client';
import { StatisticsChart } from '@/components/kids/StatisticsChart';
import { Card } from '@/components/common/Card';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/layout/PageHeader';
import type { StudentStatistics, TeacherStatistics } from '@/types/kids';

export default function StatisticsPage() {
  const { role, studentId, teacherId } = useKidsStore();
  const [studentStats, setStudentStats] = useState<StudentStatistics | null>(null);
  const [teacherStats, setTeacherStats] = useState<TeacherStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId && !teacherId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        if (role === 'student' && studentId) {
          const s = await kidsClient.statistics.student(studentId);
          if (!cancelled) setStudentStats(s);
        } else if (role === 'teacher' && teacherId) {
          const t = await kidsClient.statistics.teacher(teacherId);
          if (!cancelled) setTeacherStats(t);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [role, studentId, teacherId]);

  if (loading) return <Loader className="min-h-[40vh]" />;

  return (
    <div className="space-y-8">
      <PageHeader title="Статистика" />

      {role === 'student' && studentStats && (
        <StatisticsChart stats={studentStats} />
      )}

      {role === 'teacher' && !teacherId && (
        <Card variant="kids">
          <h2 className="text-xl font-bold text-primary">Полный доступ</h2>
          <p className="mt-2 text-gray-700">
            Статистика по преподавателям доступна в разделе «Личный кабинет» или через управление группами.
          </p>
        </Card>
      )}

      {role === 'teacher' && teacherId && teacherStats && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-primary">Мои группы</h2>
          <p className="mb-4 text-gray-700">
            Всего групп: {teacherStats.total_groups}, учеников: {teacherStats.total_students}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {teacherStats.groups.map((g) => (
              <Card key={g.group_id} variant="kids">
                <h3 className="font-semibold text-primary">{g.group_name}</h3>
                <p className="mt-2 text-gray-700">Учеников: {g.total_students}</p>
                <p className="text-gray-700">Посещаемость: {g.average_attendance_rate}%</p>
                <p className="text-gray-700">Средняя оценка: {g.average_grade ?? '—'}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {(!role || ((!studentStats && !teacherStats) && !(role === 'teacher' && !teacherId))) && (
        <Card>
          <p className="text-gray-700">Нет данных. Вы ещё не привязаны к ученику или учителю.</p>
        </Card>
      )}
    </div>
  );
}
