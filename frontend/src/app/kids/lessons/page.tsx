'use client';

import { useEffect, useState } from 'react';
import { useKidsStore } from '@/store/kidsStore';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Loader } from '@/components/common/Loader';
import { PendingHomeworks } from '@/components/kids/PendingHomeworks';
import { formatDate } from '@/lib/utils/date';
import type { Group, Grade } from '@/types/kids';
import { GRADE_TYPES } from '@/types/kids';

interface AttendanceRecord {
  id: number;
  student_id: number;
  group_id: number;
  lesson_date: string;
  present: boolean;
}

const FEEDBACK_TYPES = ['oral_hw', 'written_hw', 'dictation', 'classwork'] as const;
const HOMEWORK_NEXT_TYPE = 'homework_next';
const TEACHER_COMMENT_TYPE = 'teacher_comment';

function getUniqueLessonDates(att: AttendanceRecord[], grades: Grade[]): string[] {
  const dates = new Set<string>();
  att.forEach((a) => dates.add(a.lesson_date));
  grades.filter((g) => g.lesson_date).forEach((g) => dates.add(g.lesson_date!));
  return Array.from(dates).sort((a, b) => b.localeCompare(a));
}

export default function LessonsPage() {
  const { role, studentId } = useKidsStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  // Student: load my attendance and grades
  useEffect(() => {
    if (role !== 'student' || !studentId) {
      setLoading(false);
      return;
    }
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
  }, [role, studentId]);

  // Teacher: load groups, then attendance and grades by group (or by student if selected)
  useEffect(() => {
    if (role !== 'teacher') return;
    let cancelled = false;
    kidsClient.groups.list().then((list) => {
      if (!cancelled) setGroups(list);
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [role]);

  useEffect(() => {
    if (role !== 'teacher') return;
    if (!selectedGroupId) {
      setAttendance([]);
      setGrades([]);
      return;
    }
    setLoading(true);
    let cancelled = false;
    Promise.all([
      kidsClient.attendance.listByGroup(selectedGroupId),
      kidsClient.grades.listByGroup(selectedGroupId),
    ]).then(([att, gr]) => {
      if (!cancelled) {
        setAttendance(att);
        setGrades(gr);
      }
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [role, selectedGroupId]);

  if (!role) {
    return (
      <div className="space-y-6">
        <h1 className="text-heading text-primary">Уроки</h1>
        <Card>
          <p className="text-gray-700">Войдите как ученик или преподаватель.</p>
        </Card>
      </div>
    );
  }

  if (loading && attendance.length === 0 && grades.length === 0) return <Loader className="min-h-[40vh]" />;

  // Student view: all my lessons
  if (role === 'student' && studentId) {
    const lessonDates = getUniqueLessonDates(attendance, grades);
    return (
      <div className="space-y-6">
        <h1 className="text-heading text-primary">Уроки</h1>
        <p className="text-gray-700">Все занятия, оценки и домашние задания по каждому уроку.</p>

        <PendingHomeworks studentId={studentId} />

        {lessonDates.length === 0 ? (
          <Card>
            <p className="text-gray-600">Пока нет записей по занятиям. Они появятся после того, как преподаватель отметит посещаемость и оценки.</p>
          </Card>
        ) : (
        <div className="space-y-4">
          {lessonDates.map((dateStr) => {
            const attRec = attendance.find((a) => a.lesson_date === dateStr);
            const gradesForDate = grades.filter((g) => g.lesson_date === dateStr);
            const getGrade = (type: string) => gradesForDate.find((g) => g.type === type);
            return (
              <Card key={dateStr} variant="kids">
                <h2 className="text-lg font-bold text-primary">{formatDate(dateStr)}</h2>
                <div className="mt-3 grid gap-2 text-sm">
                  <p><span className="font-medium text-gray-700">Посещаемость:</span> {attRec?.present ? 'Был(а)' : 'Не был(а)'}</p>
                  {FEEDBACK_TYPES.map((t) => {
                    const g = getGrade(t);
                    if (!g) return null;
                    return (
                      <p key={t}><span className="font-medium text-gray-700">{GRADE_TYPES[t]}:</span> {g.value}</p>
                    );
                  })}
                  {getGrade(HOMEWORK_NEXT_TYPE)?.comment && (
                    <p><span className="font-medium text-gray-700">ДЗ на следующий урок:</span> {getGrade(HOMEWORK_NEXT_TYPE)!.comment}</p>
                  )}
                  {getGrade(TEACHER_COMMENT_TYPE)?.comment && (
                    <p className="mt-2 rounded bg-primary/10 p-2"><span className="font-medium text-primary">Комментарий преподавателя:</span> {getGrade(TEACHER_COMMENT_TYPE)!.comment}</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
        )}
      </div>
    );
  }

  // Teacher / admin / moderator view
  const lessonDates = getUniqueLessonDates(attendance, grades);
  const group = selectedGroupId ? groups.find((g) => g.id === selectedGroupId) : null;
  const students = group?.students ?? [];
  const showOneStudent = selectedStudentId != null;
  const displayStudents = showOneStudent ? students.filter((s) => s.id === selectedStudentId) : students;

  return (
    <div className="space-y-6">
      <h1 className="text-heading text-primary">Уроки</h1>
      <p className="text-gray-700">Все занятия, оценки и домашние задания по каждому уроку. Видят ученики, учителя, модераторы и администраторы.</p>

      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-gray-800">Группа</label>
            <select
              value={selectedGroupId ?? ''}
              onChange={(e) => {
                setSelectedGroupId(e.target.value ? Number(e.target.value) : null);
                setSelectedStudentId(null);
              }}
              className="w-full rounded-lg border-2 border-primary/30 px-3 py-2 focus:border-primary focus:outline-none"
            >
              <option value="">Выберите группу</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          {selectedGroupId && students.length > 0 && (
            <div className="min-w-[200px]">
              <label className="mb-1 block text-sm font-medium text-gray-800">Ученик (необязательно)</label>
              <select
                value={selectedStudentId ?? ''}
                onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border-2 border-primary/30 px-3 py-2 focus:border-primary focus:outline-none"
              >
                <option value="">Все ученики</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {!selectedGroupId && (
        <Card>
          <p className="text-gray-600">Выберите группу, чтобы увидеть журнал уроков.</p>
        </Card>
      )}

      {selectedGroupId && lessonDates.length === 0 && (
        <Card>
          <p className="text-gray-600">По этой группе пока нет записей по занятиям. Добавьте их в разделе «Посещаемость».</p>
        </Card>
      )}

      {selectedGroupId && lessonDates.length > 0 && (
        <div className="space-y-6">
          {lessonDates.map((dateStr) => {
            const attForDate = attendance.filter((a) => a.lesson_date === dateStr);
            const gradesForDate = grades.filter((g) => g.lesson_date === dateStr);
            return (
              <Card key={dateStr}>
                <h2 className="mb-4 text-lg font-bold text-primary">{formatDate(dateStr)}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary/20 text-left text-gray-700">
                        <th className="py-2 pr-2">Ученик</th>
                        <th className="py-2 pr-2">Был</th>
                        {FEEDBACK_TYPES.map((t) => (
                          <th key={t} className="py-2 pr-2">{GRADE_TYPES[t]}</th>
                        ))}
                        <th className="min-w-[100px] py-2">ДЗ на след.</th>
                        <th className="min-w-[120px] py-2">Комментарий</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayStudents.map((s) => {
                        const a = attForDate.find((x) => x.student_id === s.id);
                        const getG = (type: string) => gradesForDate.find((g) => g.student_id === s.id && g.type === type);
                        return (
                          <tr key={s.id} className="border-b border-gray-100 text-gray-800">
                            <td className="py-2 pr-2 font-medium">{s.full_name}</td>
                            <td className="py-2 pr-2">{a?.present ? '✓' : '—'}</td>
                            {FEEDBACK_TYPES.map((t) => (
                              <td key={t} className="py-2 pr-2">{getG(t)?.value ?? '—'}</td>
                            ))}
                            <td className="py-2 pr-2 text-gray-600">{getG(HOMEWORK_NEXT_TYPE)?.comment ?? '—'}</td>
                            <td className="py-2 pr-2 text-gray-600">{getG(TEACHER_COMMENT_TYPE)?.comment ?? '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
