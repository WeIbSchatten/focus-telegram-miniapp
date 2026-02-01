'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useKidsStore } from '@/store/kidsStore';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/lib/constants';
import { useNavigateAfterSuccess } from '@/lib/utils/navigation';
import type { Program } from '@/types/kids';

type QuestionType = 'single_choice' | 'multiple_choice' | 'text';

interface AnswerRow {
  id: string;
  answer_text: string;
  is_correct: boolean;
  order: number;
}

interface QuestionRow {
  id: string;
  question_text: string;
  question_type: QuestionType;
  order: number;
  answers: AnswerRow[];
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'single_choice', label: 'Один правильный ответ' },
  { value: 'multiple_choice', label: 'Несколько правильных ответов' },
  { value: 'text', label: 'Свободный ответ (текст)' },
];

function nextId() {
  return Math.random().toString(36).slice(2, 11);
}

export default function CreateTestPage() {
  const router = useRouter();
  const { show: toast } = useToast();
  const { role } = useKidsStore();
  const navigateAfterSuccess = useNavigateAfterSuccess(router);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [programId, setProgramId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState<number | ''>('');
  const [questions, setQuestions] = useState<QuestionRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    kidsClient.programs.list().then((list) => {
      if (!cancelled) setPrograms(list);
    }).catch(() => toast('Ошибка загрузки программ')).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [toast]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: nextId(),
        question_text: '',
        question_type: 'single_choice',
        order: prev.length,
        answers: [
          { id: nextId(), answer_text: '', is_correct: false, order: 0 },
          { id: nextId(), answer_text: '', is_correct: false, order: 1 },
        ],
      },
    ]);
  };

  const removeQuestion = (qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const updateQuestion = (qId: string, field: keyof QuestionRow, value: string | number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, [field]: value } : q))
    );
  };

  const addAnswer = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const maxOrder = q.answers.length ? Math.max(...q.answers.map((a) => a.order)) : -1;
        return {
          ...q,
          answers: [
            ...q.answers,
            { id: nextId(), answer_text: '', is_correct: false, order: maxOrder + 1 },
          ],
        };
      })
    );
  };

  const removeAnswer = (qId: string, aId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const next = q.answers.filter((a) => a.id !== aId);
        if (next.length < 2 && (q.question_type === 'single_choice' || q.question_type === 'multiple_choice')) return q;
        return { ...q, answers: next.map((a, i) => ({ ...a, order: i })) };
      })
    );
  };

  const updateAnswer = (qId: string, aId: string, field: keyof AnswerRow, value: string | boolean | number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        return {
          ...q,
          answers: q.answers.map((a) => (a.id === aId ? { ...a, [field]: value } : a)),
        };
      })
    );
  };

  const setCorrectAnswer = (qId: string, aId: string, correct: boolean) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        if (q.question_type === 'single_choice' && correct) {
          return {
            ...q,
            answers: q.answers.map((a) => ({ ...a, is_correct: a.id === aId })),
          };
        }
        return {
          ...q,
          answers: q.answers.map((a) => (a.id === aId ? { ...a, is_correct: correct } : a)),
        };
      })
    );
  };

  const handleQuestionTypeChange = (qId: string, newType: QuestionType) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        if (newType === 'text') {
          return { ...q, question_type: newType, answers: [] };
        }
        if (q.answers.length === 0) {
          return {
            ...q,
            question_type: newType,
            answers: [
              { id: nextId(), answer_text: '', is_correct: false, order: 0 },
              { id: nextId(), answer_text: '', is_correct: false, order: 1 },
            ],
          };
        }
        return { ...q, question_type: newType };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId || !title.trim()) {
      toast('Укажите программу и название теста.');
      return;
    }
    if (questions.length === 0) {
      toast('Добавьте хотя бы один вопрос.');
      return;
    }
    const invalidQuestion = questions.find(
      (q) => !q.question_text.trim() || ((q.question_type === 'single_choice' || q.question_type === 'multiple_choice') && (q.answers.length < 2 || !q.answers.some((a) => a.is_correct)))
    );
    if (invalidQuestion) {
      toast('Заполните текст вопроса и для выбора ответов укажите минимум 2 варианта и отметьте правильный(е).');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        program_id: Number(programId),
        title: title.trim(),
        description: description.trim() || null,
        order,
        max_attempts: maxAttempts === '' ? null : Number(maxAttempts),
        questions: questions.map((q, i) => ({
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          order: i,
          answers:
            q.question_type === 'text'
              ? []
              : q.answers.map((a, j) => ({
                  answer_text: a.answer_text.trim(),
                  is_correct: a.is_correct,
                  order: j,
                })),
        })),
      };
      await kidsClient.tests.create(payload);
      toast('Тест успешно создан.');
      navigateAfterSuccess(ROUTES.kids.learning);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : 'Ошибка сохранения';
      toast(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (role !== 'teacher') {
    return (
      <div className="space-y-6">
        <h1 className="text-heading text-primary">Создание теста</h1>
        <Card>
          <p className="text-gray-700">Создавать тесты могут только учителя, модераторы и администраторы.</p>
          <Link href={ROUTES.kids.learning} className="mt-4 inline-block text-primary font-medium hover:underline">
            ← К обучению
          </Link>
        </Card>
      </div>
    );
  }

  if (loading) return <Loader className="min-h-[40vh]" />;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-heading text-primary">Создать тест</h1>
        <p className="mt-2 text-gray-700">
          Выберите программу, укажите название и добавьте вопросы с вариантами ответов. Отметьте правильный ответ (или несколько для типа «Несколько правильных»).
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="mb-4 text-xl font-bold text-primary">Основные данные</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">Программа *</label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-lg border-2 border-primary/30 px-3 py-2 focus:border-primary focus:outline-none"
                required
              >
                <option value="">Выберите программу</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Input
                label="Порядок (число)"
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div>
              <Input
                label="Попыток на тест"
                type="number"
                min={1}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value === '' ? '' : parseInt(e.target.value, 10) || '')}
                placeholder="Пусто = неограниченно"
              />
              <p className="mt-1 text-xs text-gray-600">Оставьте пустым для неограниченного числа попыток. Учитывается лучший результат.</p>
            </div>
          </div>
          <div className="mt-4">
            <Input
              label="Название теста *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Глагол to be"
              required
            />
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-800">Описание (необязательно)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] w-full rounded-lg border-2 border-primary/30 px-3 py-2 focus:border-primary focus:outline-none"
              placeholder="Краткое описание теста"
              rows={3}
            />
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Вопросы</h2>
            <Button type="button" variant="outline" onClick={addQuestion}>
              + Добавить вопрос
            </Button>
          </div>

          {questions.length === 0 && (
            <p className="text-gray-600">Нажмите «Добавить вопрос», чтобы создать первый вопрос.</p>
          )}

          <div className="space-y-6">
            {questions.map((q, qIndex) => (
              <div
                key={q.id}
                className="rounded-xl border-2 border-primary/20 bg-gray-50/50 p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <span className="text-sm font-semibold text-primary">Вопрос {qIndex + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => removeQuestion(q.id)}
                  >
                    Удалить
                  </Button>
                </div>
                <div className="space-y-3">
                  <textarea
                    value={q.question_text}
                    onChange={(e) => updateQuestion(q.id, 'question_text', e.target.value)}
                    className="min-h-[60px] w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Текст вопроса"
                    required
                    rows={2}
                  />
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Тип вопроса</label>
                    <select
                      value={q.question_type}
                      onChange={(e) => handleQuestionTypeChange(q.id, e.target.value as QuestionType)}
                      className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {(q.question_type === 'single_choice' || q.question_type === 'multiple_choice') && (
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Варианты ответа (отметьте правильный)</span>
                        <Button type="button" variant="ghost" className="text-sm" onClick={() => addAnswer(q.id)}>
                          + Вариант
                        </Button>
                      </div>
                      <ul className="space-y-2">
                        {q.answers.map((a, aIndex) => (
                          <li key={a.id} className="flex items-center gap-2">
                            <input
                              type={q.question_type === 'single_choice' ? 'radio' : 'checkbox'}
                              name={`correct-${q.id}`}
                              checked={a.is_correct}
                              onChange={() => setCorrectAnswer(q.id, a.id, !a.is_correct)}
                              className="rounded border-primary text-primary"
                            />
                            <input
                              type="text"
                              value={a.answer_text}
                              onChange={(e) => updateAnswer(q.id, a.id, 'answer_text', e.target.value)}
                              className="flex-1 rounded border border-gray-300 px-2 py-1"
                              placeholder={`Вариант ${aIndex + 1}`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => removeAnswer(q.id, a.id)}
                              disabled={q.answers.length <= 2}
                            >
                              ×
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-wrap gap-4">
          <Button type="submit" variant="kids" loading={saving}>
            Создать тест
          </Button>
          <Link href={ROUTES.kids.learning}>
            <Button type="button" variant="ghost">
              Отмена
            </Button>
          </Link>
        </div>
      </form>

      <Link href={ROUTES.kids.learning} className="inline-block text-primary font-medium hover:underline">
        ← К обучению
      </Link>
    </div>
  );
}
