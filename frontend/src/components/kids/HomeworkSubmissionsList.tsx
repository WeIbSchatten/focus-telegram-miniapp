'use client';

import { useEffect, useState } from 'react';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useToast } from '@/hooks/useToast';
import type { Homework, HomeworkSubmission } from '@/types/kids';
import type { Student } from '@/types/kids';

interface HomeworkSubmissionsListProps {
  homework: Homework;
}

export function HomeworkSubmissionsList({ homework }: HomeworkSubmissionsListProps) {
  const { show: toast } = useToast();
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<number, Student>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [gradeVal, setGradeVal] = useState('');
  const [commentVal, setCommentVal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      kidsClient.homeworks.submissions.listByHomework(homework.id),
      kidsClient.students.list(),
    ]).then(([subs, students]) => {
      if (cancelled) return;
      setSubmissions(subs);
      const map: Record<number, Student> = {};
      students.forEach((s) => { map[s.id] = s; });
      setStudentsMap(map);
    }).catch(() => toast('Ошибка загрузки ответов')).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [homework.id, toast]);

  const startEdit = (s: HomeworkSubmission) => {
    setEditingId(s.id);
    setGradeVal(s.grade != null ? String(s.grade) : '');
    setCommentVal(s.teacher_comment ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setGradeVal('');
    setCommentVal('');
  };

  const saveGrade = async () => {
    if (editingId == null) return;
    setSaving(true);
    try {
      await kidsClient.homeworks.submissions.update(editingId, {
        grade: gradeVal === '' ? undefined : Math.min(5, Math.max(1, parseInt(gradeVal, 10) || 0)),
        teacher_comment: commentVal || undefined,
      });
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? {
                ...s,
                grade: gradeVal === '' ? null : Math.min(5, Math.max(1, parseInt(gradeVal, 10) || 0)),
                teacher_comment: commentVal || null,
              }
            : s
        )
      );
      toast('Оценка сохранена.');
      cancelEdit();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'Ошибка';
      toast(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-600">Загрузка ответов...</p>;

  if (submissions.length === 0) {
    return (
      <Card>
        <h3 className="font-semibold text-primary">Ответы учеников</h3>
        <p className="mt-2 text-gray-600">Пока нет сданных ответов.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-4 font-semibold text-primary">Ответы учеников — проверка и оценка</h3>
      <div className="space-y-4">
        {submissions.map((s) => (
          <div
            key={s.id}
            className="rounded-lg border border-primary/20 bg-gray-50/50 p-4"
          >
            <p className="font-medium text-primary">
              {studentsMap[s.student_id]?.full_name ?? `Ученик #${s.student_id}`}
            </p>
            {s.answer_text && (
              <p className="mt-2 whitespace-pre-wrap text-gray-700">{s.answer_text}</p>
            )}
            {s.files?.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {s.files.map((f) => (
                  <li key={f.id}>
                    <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {f.file_name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {editingId === s.id ? (
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Оценка (1–5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={gradeVal}
                  onChange={(e) => setGradeVal(e.target.value)}
                  className="w-20 rounded border border-gray-300 px-2 py-1"
                />
                <label className="mt-2 block text-sm font-medium text-gray-700">Комментарий учителя</label>
                <textarea
                  value={commentVal}
                  onChange={(e) => setCommentVal(e.target.value)}
                  className="min-h-[80px] w-full rounded border border-gray-300 px-2 py-1"
                  rows={3}
                />
                <div className="mt-2 flex gap-2">
                  <Button variant="kids" onClick={saveGrade} loading={saving}>
                    Сохранить
                  </Button>
                  <Button variant="ghost" onClick={cancelEdit} disabled={saving}>
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                {s.grade != null && (
                  <span className="font-medium text-primary">Оценка: {s.grade}</span>
                )}
                {s.teacher_comment && (
                  <span className="text-gray-600">{s.teacher_comment}</span>
                )}
                <Button variant="ghost" className="text-sm" onClick={() => startEdit(s)}>
                  {s.grade != null ? 'Изменить оценку' : 'Поставить оценку'}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
