'use client';

import { useEffect, useState } from 'react';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { useToast } from '@/hooks/useToast';
import type { Group, Grade, Program } from '@/types/kids';
import { GRADE_TYPES } from '@/types/kids';
import { formatDate } from '@/lib/utils/date';

interface AttendanceRecord {
  id: number;
  student_id: number;
  group_id: number;
  lesson_date: string;
  present: boolean;
  program_id?: number | null;
}

const FEEDBACK_TYPES = ['oral_hw', 'written_hw', 'dictation', 'classwork'] as const;
const HOMEWORK_NEXT_TYPE = 'homework_next';
const TEACHER_COMMENT_TYPE = 'teacher_comment';

export function AttendanceTeacherView() {
  const { show: toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [programsOfGroup, setProgramsOfGroup] = useState<Program[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [lessonDate, setLessonDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [attendanceByGroup, setAttendanceByGroup] = useState<AttendanceRecord[]>([]);
  const [gradesByGroup, setGradesByGroup] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Row state: student_id -> { present, oral_hw, written_hw, dictation, classwork, homework_next, teacher_comment }
  const [rows, setRows] = useState<Record<number, { present: boolean; oral_hw: string; written_hw: string; dictation: string; classwork: string; homework_next: string; teacher_comment: string }>>({});

  useEffect(() => {
    let cancelled = false;
    kidsClient.groups.list().then((list) => {
      if (!cancelled) setGroups(list);
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedGroupId) {
      setGroup(null);
      setProgramsOfGroup([]);
      setAttendanceByGroup([]);
      setGradesByGroup([]);
      setRows({});
      setSelectedProgramId(null);
      return;
    }
    let cancelled = false;
    kidsClient.programs.listByGroup(selectedGroupId).then((list) => {
      if (!cancelled) setProgramsOfGroup(list);
    }).catch(() => { if (!cancelled) setProgramsOfGroup([]); });
    return () => { cancelled = true; };
  }, [selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId) return;
    setLoading(true);
    let cancelled = false;
    Promise.all([
      kidsClient.groups.get(selectedGroupId),
      kidsClient.attendance.listByGroup(selectedGroupId),
      kidsClient.grades.listByGroup(selectedGroupId),
    ]).then(([g, att, gr]) => {
      if (cancelled) return;
      setGroup(g);
      setAttendanceByGroup(att);
      setGradesByGroup(gr);
      const students = g.students ?? [];
      const dateStr = lessonDate;
      const attForDate = att.filter((a) => a.lesson_date === dateStr);
      const gradesForDate = gr.filter((x) => x.lesson_date === dateStr);
      const programIdFromLesson = attForDate.find((a) => a.program_id != null)?.program_id ?? null;
      if (programIdFromLesson != null) setSelectedProgramId(programIdFromLesson);
      const next: Record<number, { present: boolean; oral_hw: string; written_hw: string; dictation: string; classwork: string; homework_next: string; teacher_comment: string }> = {};
      for (const s of students) {
        const a = attForDate.find((x) => x.student_id === s.id);
        const present = a?.present ?? true;
        const getGrade = (type: string) => gradesForDate.find((gr) => gr.student_id === s.id && gr.type === type);
        next[s.id] = {
          present,
          oral_hw: String(getGrade('oral_hw')?.value ?? ''),
          written_hw: String(getGrade('written_hw')?.value ?? ''),
          dictation: String(getGrade('dictation')?.value ?? ''),
          classwork: String(getGrade('classwork')?.value ?? ''),
          homework_next: getGrade('homework_next')?.comment ?? '',
          teacher_comment: getGrade(TEACHER_COMMENT_TYPE)?.comment ?? '',
        };
      }
      setRows(next);
    }).catch(() => toast('Ошибка загрузки')).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedGroupId, lessonDate, toast]);

  const handleRowChange = (studentId: number, field: string, value: string | boolean) => {
    setRows((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedGroupId || !group) return;
    setSaving(true);
    try {
      const dateStr = lessonDate;
      const students = group.students ?? [];
      const attForDate = attendanceByGroup.filter((a) => a.lesson_date === dateStr);

      for (const s of students) {
        const row = rows[s.id];
        if (!row) continue;

        // Attendance
        const existingAtt = attForDate.find((a) => a.student_id === s.id);
        const programId = selectedProgramId ?? undefined;
        if (existingAtt) {
          await kidsClient.attendance.update(existingAtt.id, { present: row.present, program_id: programId });
        } else {
          await kidsClient.attendance.create({
            student_id: s.id,
            group_id: selectedGroupId,
            lesson_date: dateStr,
            present: row.present,
            program_id: programId,
          });
        }

        // Grades: oral_hw, written_hw, dictation, classwork (value 1-5), homework_next, teacher_comment (text)
        const gradesForDate = gradesByGroup.filter((g) => g.lesson_date === dateStr && g.student_id === s.id);
        const textTypes = [HOMEWORK_NEXT_TYPE, TEACHER_COMMENT_TYPE] as const;
        const typesToSave = [...FEEDBACK_TYPES, ...textTypes];
        for (const type of typesToSave) {
          const isTextType = type === HOMEWORK_NEXT_TYPE || type === TEACHER_COMMENT_TYPE;
          const val = isTextType ? (type === HOMEWORK_NEXT_TYPE ? row.homework_next : row.teacher_comment) : (row[type as (typeof FEEDBACK_TYPES)[number]] ?? '');
          const numVal = !isTextType ? (val === '' ? null : Math.min(5, Math.max(1, parseInt(val, 10) || 0))) : null;
          const existing = gradesForDate.find((g) => g.type === type);
          const programId = selectedProgramId ?? undefined;
          if (isTextType) {
            if (val.trim()) {
              if (existing) {
                await kidsClient.grades.update(existing.id, { comment: val.trim(), program_id: programId });
              } else {
                await kidsClient.grades.create({
                  student_id: s.id,
                  group_id: selectedGroupId,
                  lesson_date: dateStr,
                  value: 0,
                  type,
                  comment: val.trim(),
                  program_id: programId,
                });
              }
            } else if (existing) {
              await kidsClient.grades.delete(existing.id);
            }
          } else {
            if (numVal !== null && numVal > 0) {
              if (existing) {
                await kidsClient.grades.update(existing.id, { value: numVal, program_id: programId });
              } else {
                await kidsClient.grades.create({
                  student_id: s.id,
                  group_id: selectedGroupId,
                  lesson_date: dateStr,
                  value: numVal,
                  type,
                  comment: null,
                  program_id: programId,
                });
              }
            } else if (existing) {
              await kidsClient.grades.delete(existing.id);
            }
          }
        }
      }

      toast('Сохранено.');
      const programName = programsOfGroup.find((p) => p.id === selectedProgramId)?.name;
      try {
        await kidsClient.grades.notifyForLesson(selectedGroupId, dateStr, programName);
      } catch {
        // уведомление в бот не блокирует успех сохранения
      }
      const [_, att, gr] = await Promise.all([
        kidsClient.groups.get(selectedGroupId),
        kidsClient.attendance.listByGroup(selectedGroupId),
        kidsClient.grades.listByGroup(selectedGroupId),
      ]);
      setAttendanceByGroup(att);
      setGradesByGroup(gr);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'Ошибка сохранения';
      toast(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !group) return <Loader className="min-h-[40vh]" />;

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4 text-xl font-bold text-primary">Группа, тема и дата занятия</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-gray-800">Группа</label>
            <select
              value={selectedGroupId ?? ''}
              onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg border-2 border-primary/30 px-3 py-2 focus:border-primary focus:outline-none"
            >
              <option value="">Выберите группу</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[220px]">
            <label className="mb-1 block text-sm font-medium text-gray-800">Тема (программа) урока</label>
            <select
              value={selectedProgramId ?? ''}
              onChange={(e) => setSelectedProgramId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg border-2 border-primary/30 px-3 py-2 focus:border-primary focus:outline-none"
            >
              <option value="">Выберите программу</option>
              {programsOfGroup.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <Input
              type="date"
              label="Дата занятия"
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {group && (group.students?.length ?? 0) > 0 && (
        <Card>
          <h2 className="mb-4 text-xl font-bold text-primary">
            Посещаемость и обратная связь — {formatDate(lessonDate)}
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            3.1 Посещаемость (был/не был), 3.2 Обратная связь (оценки 1–5), 3.3 ДЗ на следующий урок
          </p>
          {loading ? (
            <Loader />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary/20 text-left text-gray-700">
                      <th className="whitespace-nowrap py-2 pr-2">Ученик</th>
                      <th className="whitespace-nowrap py-2 pr-2">Был</th>
                      {FEEDBACK_TYPES.map((t) => (
                        <th key={t} className="whitespace-nowrap py-2 pr-2">{GRADE_TYPES[t]}</th>
                      ))}
                      <th className="min-w-[140px] py-2">ДЗ на след. урок</th>
                      <th className="min-w-[140px] py-2">Комментарий</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(group.students ?? []).map((s) => (
                      <tr key={s.id} className="border-b border-gray-100 text-gray-800">
                        <td className="py-2 pr-2 font-medium">{s.full_name}</td>
                        <td className="py-2 pr-2">
                          <input
                            type="checkbox"
                            checked={rows[s.id]?.present ?? true}
                            onChange={(e) => handleRowChange(s.id, 'present', e.target.checked)}
                            className="rounded border-primary text-primary"
                          />
                        </td>
                        {FEEDBACK_TYPES.map((t) => (
                          <td key={t} className="py-2 pr-2">
                            <input
                              type="number"
                              min={1}
                              max={5}
                              placeholder="1–5"
                              className="w-14 rounded border border-gray-300 px-1 py-0.5 text-center"
                              value={rows[s.id]?.[t] ?? ''}
                              onChange={(e) => handleRowChange(s.id, t, e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            placeholder="Текст ДЗ"
                            className="w-full rounded border border-gray-300 px-2 py-1"
                            value={rows[s.id]?.homework_next ?? ''}
                            onChange={(e) => handleRowChange(s.id, 'homework_next', e.target.value)}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            placeholder="Комментарий ученику"
                            className="w-full rounded border border-gray-300 px-2 py-1"
                            value={rows[s.id]?.teacher_comment ?? ''}
                            onChange={(e) => handleRowChange(s.id, 'teacher_comment', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Button type="button" variant="kids" onClick={handleSave} loading={saving}>
                  Сохранить
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {group && (group.students?.length ?? 0) === 0 && (
        <Card>
          <p className="text-gray-700">В этой группе пока нет учеников. Назначьте учеников в группу в разделе «Группы».</p>
        </Card>
      )}

      {!selectedGroupId && (
        <Card>
          <p className="text-gray-700">Выберите группу и дату занятия, чтобы отметить посещаемость и ввести обратную связь.</p>
        </Card>
      )}
    </div>
  );
}
