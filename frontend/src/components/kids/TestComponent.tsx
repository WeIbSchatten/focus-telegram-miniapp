'use client';

import { useState, useEffect } from 'react';
import { useKidsStore } from '@/store/kidsStore';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useToast } from '@/hooks/useToast';
import type { Test, TestQuestion, TestAnswer, TestSubmission } from '@/types/kids';

interface TestComponentProps {
  test: Test;
}

type AnswerState = Record<number, string | number[]>;

export function TestComponent({ test }: TestComponentProps) {
  const { studentId } = useKidsStore();
  const { show: toast } = useToast();
  const [answers, setAnswers] = useState<AnswerState>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ score: number; max_score: number } | null>(null);
  const [bestResult, setBestResult] = useState<TestSubmission | null>(null);
  const [attemptsUsed, setAttemptsUsed] = useState(0);

  const maxAttempts = test.max_attempts ?? null;
  const [approvedRetakes, setApprovedRetakes] = useState(0);
  const allowedAttempts = maxAttempts === null ? Infinity : maxAttempts + approvedRetakes;
  const noAttemptsLeft = maxAttempts !== null && attemptsUsed >= allowedAttempts;

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    Promise.all([
      kidsClient.tests.submissions.bestByStudent(studentId),
      kidsClient.tests.submissions.listByStudent(studentId),
    ]).then(([bestList, allList]) => {
      if (cancelled) return;
      const best = bestList.find((s) => s.test_id === test.id) ?? null;
      const forTest = allList.filter((s) => s.test_id === test.id);
      setBestResult(best);
      setAttemptsUsed(forTest.length);
      setApprovedRetakes(forTest.filter((s) => s.is_approved_for_retake).length);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [studentId, test.id]);

  const handleSingleChoice = (questionId: number, answerId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: [answerId] }));
  };

  const handleMultipleChoice = (questionId: number, answerId: number, checked: boolean) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as number[] | undefined) ?? [];
      const next = checked ? [...current, answerId] : current.filter((id) => id !== answerId);
      return { ...prev, [questionId]: next };
    });
  };

  const handleTextAnswer = (questionId: number, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast('Вы не привязаны как ученик.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        test_id: test.id,
        student_id: studentId,
        answers: test.questions.map((q) => {
          const val = answers[q.id];
          if (q.question_type === 'single_choice' || q.question_type === 'multiple_choice') {
            const ids = Array.isArray(val) ? val : [];
            return {
              question_id: q.id,
              selected_answer_ids: JSON.stringify(ids),
            };
          }
          return {
            question_id: q.id,
            answer_text: typeof val === 'string' ? val : '',
          };
        }),
      };
      const result = await kidsClient.tests.submissions.create(payload);
      setAttemptsUsed((n) => n + 1);
      const [bestList] = await Promise.all([
        kidsClient.tests.submissions.bestByStudent(studentId!),
      ]);
      const best = bestList.find((s) => s.test_id === test.id) ?? null;
      setBestResult(best);
      const displayScore = best ? (best.score ?? 0) : (result.score ?? 0);
      const displayMax = best ? (best.max_score ?? 0) : (result.max_score ?? 0);
      setScore({ score: displayScore, max_score: displayMax });
      setSubmitted(true);
      toast(`Тест сдан. Лучший результат: ${displayScore} из ${displayMax}`);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'Ошибка отправки';
      toast(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setLoading(false);
    }
  };

  const showBestResult = (bestResult && (bestResult.score != null)) || (submitted && score);
  const displayScore = bestResult && bestResult.score != null
    ? { score: bestResult.score, max_score: bestResult.max_score ?? 0 }
    : score;

  return (
    <div className="space-y-6">
      {showBestResult && displayScore && (
        <Card variant="kids">
          <h3 className="font-semibold text-primary">Лучший результат</h3>
          <p className="mt-2 text-2xl font-bold text-primary">
            {displayScore.score} из {displayScore.max_score}
          </p>
          {maxAttempts !== null && (
            <p className="mt-2 text-sm text-gray-600">
              Попыток: {attemptsUsed} из {allowedAttempts === Infinity ? maxAttempts : allowedAttempts}
              {approvedRetakes > 0 && ` (+${approvedRetakes} пересдач)`}
            </p>
          )}
          {noAttemptsLeft && (
            <p className="mt-2 text-sm text-amber-700">Достигнут лимит попыток. Дополнительную попытку может разрешить учитель.</p>
          )}
        </Card>
      )}

      {!noAttemptsLeft && (
        <form onSubmit={handleSubmit} className="space-y-6">
      {test.questions
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((q) => (
          <Card key={q.id}>
            <p className="font-medium text-gray-800">{q.question_text}</p>
            <div className="mt-4 space-y-2">
              {q.question_type === 'single_choice' &&
                q.answers
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((a) => (
                    <label key={a.id} className="flex cursor-pointer items-center gap-2 text-gray-800">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={(answers[q.id] as number[])?.[0] === a.id}
                        onChange={() => handleSingleChoice(q.id, a.id)}
                        className="border-primary text-primary focus:ring-primary"
                      />
                      <span>{a.answer_text}</span>
                    </label>
                  ))}
              {q.question_type === 'multiple_choice' &&
                q.answers
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((a) => (
                    <label key={a.id} className="flex cursor-pointer items-center gap-2 text-gray-800">
                      <input
                        type="checkbox"
                        checked={((answers[q.id] as number[]) ?? []).includes(a.id)}
                        onChange={(e) => handleMultipleChoice(q.id, a.id, e.target.checked)}
                        className="rounded border-primary text-primary focus:ring-primary"
                      />
                      <span>{a.answer_text}</span>
                    </label>
                  ))}
              {q.question_type === 'text' && (
                <textarea
                  value={(answers[q.id] as string) ?? ''}
                  onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                  className="min-h-[80px] w-full rounded-lg border-2 border-primary/30 px-3 py-2 focus:border-primary focus:outline-none"
                  placeholder="Введите ответ"
                />
              )}
            </div>
          </Card>
        ))}
      <Button type="submit" variant="kids" loading={loading}>
        Сдать тест
      </Button>
    </form>
      )}

      {noAttemptsLeft && !showBestResult && (
        <Card>
          <p className="text-gray-700">Попытки по этому тесту исчерпаны ({attemptsUsed} из {allowedAttempts}). Дополнительную попытку может разрешить учитель.</p>
        </Card>
      )}

      {maxAttempts !== null && !noAttemptsLeft && (
        <p className="text-sm text-gray-600">Попыток использовано: {attemptsUsed} из {allowedAttempts === Infinity ? maxAttempts : allowedAttempts}. Учитывается лучший результат.</p>
      )}
    </div>
  );
}
