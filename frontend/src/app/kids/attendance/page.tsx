'use client';

import { useEffect, useState } from 'react';
import { useKidsStore } from '@/store/kidsStore';
import { kidsClient } from '@/lib/api/kids-client';
import { AttendanceTable } from '@/components/kids/AttendanceTable';
import { AttendanceTeacherView } from '@/components/kids/AttendanceTeacherView';
import { Card } from '@/components/common/Card';
import { Loader } from '@/components/common/Loader';

interface AttendanceRecord {
  id: number;
  student_id: number;
  group_id: number;
  lesson_date: string;
  present: boolean;
}

export default function AttendancePage() {
  const { role, studentId } = useKidsStore();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== 'student' || !studentId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    kidsClient.attendance.listByStudent(studentId).then((list) => {
      if (!cancelled) setRecords(list);
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [role, studentId]);

  if (loading && role === 'student') return <Loader className="min-h-[40vh]" />;

  // Учитель: группа → ученик → дата занятия → посещаемость, обратная связь, ДЗ на следующий урок
  if (role === 'teacher') {
    return (
      <div className="space-y-6">
        <h1 className="text-heading text-primary">Посещаемость и обратная связь</h1>
        <p className="text-gray-700">
          Выберите группу и дату занятия. Отметьте посещаемость (был/не был), введите обратную связь (ДЗ устное/письменное, диктант, работа на уроке) и ДЗ на следующий урок.
        </p>
        <AttendanceTeacherView />
      </div>
    );
  }

  if (role !== 'student') {
    return (
      <Card>
        <p className="text-gray-700">Посещаемость доступна ученикам (просмотр) и учителям (ввод).</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-heading text-primary">Посещаемость</h1>
      <AttendanceTable records={records} />
    </div>
  );
}
