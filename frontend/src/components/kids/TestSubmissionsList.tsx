'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useToast } from '@/hooks/useToast';
import type { Test, TestSubmission } from '@/types/kids';
import type { Student } from '@/types/kids';

interface TestSubmissionsListProps {
  test: Test;
}

/** Номер попытки по студенту: для каждой попытки одного студента — 1, 2, 3... */
function useAttemptNumbers(submissions: TestSubmission[]): Map<number, number> {
  return useMemo(() => {
    const byStudent = new Map<number, TestSubmission[]>();
    for (const s of submissions) {
      const list = byStudent.get(s.student_id) ?? [];
      list.push(s);
      byStudent.set(s.student_id, list);
    }
    Array.from(byStudent.values()).forEach((list) => {
      list.sort((a, b) => a.id - b.id);
    });
    const attemptNum = new Map<number, number>();
    byStudent.forEach((list) => {
      list.forEach((sub, i) => attemptNum.set(sub.id, i + 1));
    });
    return attemptNum;
  }, [submissions]);
}

export function TestSubmissionsList({ test }: TestSubmissionsListProps) {
  const { show: toast } = useToast();
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<number, Student>>({});
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const attemptNumbers = useAttemptNumbers(submissions);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      kidsClient.tests.submissions.listByTest(test.id),
      kidsClient.students.list(),
    ]).then(([subs, students]) => {
      if (cancelled) return;
      setSubmissions(subs);
      const map: Record<number, Student> = {};
      students.forEach((s) => { map[s.id] = s; });
      setStudentsMap(map);
    }).catch(() => { if (!cancelled) toast('Ошибка загрузки сданных тестов'); }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [test.id, toast]);

  const handleApproveRetake = async (submissionId: number) => {
    setApprovingId(submissionId);
    try {
      await kidsClient.tests.submissions.update(submissionId, { is_approved_for_retake: true });
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? { ...s, is_approved_for_retake: true } : s))
      );
      toast('Пересдача разрешена.');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'Ошибка';
      toast(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) return <p className="text-gray-600">Загрузка сданных тестов...</p>;

  if (submissions.length === 0) {
    return (
      <Card>
        <h3 className="font-semibold text-primary">Сданные тесты</h3>
        <p className="mt-2 text-gray-600">Пока никто не сдал этот тест.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-4 font-semibold text-primary">Попытки учеников — баллы, ответы и пересдача</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-primary/20 text-left text-gray-700">
              <th className="py-2 pr-4">Ученик</th>
              <th className="py-2 pr-4">Попытка</th>
              <th className="py-2 pr-4">Баллы</th>
              <th className="py-2 pr-4">Пересдача</th>
              <th className="py-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <Fragment key={s.id}>
                <tr className="border-b border-gray-100 text-gray-800">
                  <td className="py-2 pr-4 font-medium">
                    {studentsMap[s.student_id]?.full_name ?? `Ученик #${s.student_id}`}
                  </td>
                  <td className="py-2 pr-4">
                    Попытка {attemptNumbers.get(s.id) ?? 1}
                  </td>
                  <td className="py-2 pr-4">
                    {s.score != null && s.max_score != null
                      ? `${s.score} из ${s.max_score}`
                      : '—'}
                  </td>
                  <td className="py-2 pr-4">
                    {s.is_approved_for_retake ? (
                      <span className="text-green-600">Разрешена</span>
                    ) : (
                      <span className="text-gray-500">Не разрешена</span>
                    )}
                  </td>
                  <td className="py-2 flex flex-wrap gap-1">
                    <Button
                      variant="ghost"
                      className="text-sm"
                      onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    >
                      {expandedId === s.id ? 'Свернуть ответы' : 'Ответы'}
                    </Button>
                    {!s.is_approved_for_retake && (
                      <Button
                        variant="outline"
                        className="text-sm"
                        onClick={() => handleApproveRetake(s.id)}
                        loading={approvingId === s.id}
                      >
                        Разрешить пересдачу
                      </Button>
                    )}
                  </td>
                </tr>
                {expandedId === s.id && (
                  <tr>
                    <td colSpan={5} className="bg-gray-50/80 p-4">
                      <SubmissionAnswersDetail submission={s} test={test} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** Блок с вопросами теста и ответами ученика по одной попытке. */
function SubmissionAnswersDetail({
  submission,
  test,
}: {
  submission: TestSubmission;
  test: Test;
}) {
  const questions = test.questions ?? [];
  const answersByQ = new Map(submission.answers.map((a) => [a.question_id, a]));

  return (
    <div className="space-y-4 text-sm">
      <h4 className="font-semibold text-primary">Ответы по вопросам</h4>
      {questions.length === 0 ? (
        <p className="text-gray-500">В тесте нет вопросов.</p>
      ) : (
        <ol className="list-decimal list-inside space-y-3">
          {questions.map((q) => {
            const ans = answersByQ.get(q.id);
            const isCorrect = ans ? checkAnswerCorrect(q, ans) : null;
            const answerText = formatStudentAnswer(q, ans);
            return (
              <li key={q.id} className="rounded border border-primary/10 bg-white p-3">
                <p className="font-medium text-gray-800">{q.question_text}</p>
                <p className="mt-1 text-gray-700">
                  <span className="text-gray-500">Ответ: </span>
                  {answerText}
                </p>
                {isCorrect !== null && (
                  <p className="mt-1">
                    {isCorrect ? (
                      <span className="text-green-600">Верно</span>
                    ) : (
                      <span className="text-red-600">Неверно</span>
                    )}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function checkAnswerCorrect(
  question: { question_type: string; answers: { id: number; is_correct: boolean }[] },
  answer: { selected_answer_ids: string | null; answer_text: string | null }
): boolean | null {
  if (question.question_type === 'text') return null;
  const correctIds = new Set(
    question.answers.filter((a) => a.is_correct).map((a) => String(a.id))
  );
  if (!answer.selected_answer_ids) return correctIds.size === 0;
  try {
    const selected = JSON.parse(answer.selected_answer_ids) as string[];
    const selectedSet = new Set(Array.isArray(selected) ? selected.map(String) : []);
    if (correctIds.size !== selectedSet.size) return false;
    return Array.from(correctIds).every((id) => selectedSet.has(id));
  } catch {
    return false;
  }
}

function formatStudentAnswer(
  question: { question_type: string; answers: { id: number; answer_text: string }[] },
  answer: { selected_answer_ids: string | null; answer_text: string | null } | undefined
): string {
  if (!answer) return '—';
  if (answer.answer_text) return answer.answer_text;
  if (!answer.selected_answer_ids) return '—';
  try {
    const ids = JSON.parse(answer.selected_answer_ids) as number[];
    const idSet = new Set(Array.isArray(ids) ? ids.map(Number) : []);
    const texts = question.answers
      .filter((a) => idSet.has(a.id))
      .map((a) => a.answer_text)
      .join(', ');
    return texts || answer.selected_answer_ids;
  } catch {
    return answer.selected_answer_ids;
  }
}
