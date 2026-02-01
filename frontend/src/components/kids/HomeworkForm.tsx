'use client';

import { useState } from 'react';
import { useKidsStore } from '@/store/kidsStore';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useToast } from '@/hooks/useToast';
import type { Homework } from '@/types/kids';

interface HomeworkFormProps {
  homework: Homework;
  existingSubmission?: { id: number; answer_text: string | null } | null;
}

export function HomeworkForm({ homework, existingSubmission }: HomeworkFormProps) {
  const { studentId } = useKidsStore();
  const { show: toast } = useToast();
  const [answerText, setAnswerText] = useState(existingSubmission?.answer_text ?? '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast('Вы не привязаны как ученик.');
      return;
    }
    setLoading(true);
    try {
      if (existingSubmission) {
        await kidsClient.homeworks.submissions.update(existingSubmission.id, { answer_text: answerText });
        toast('Ответ обновлён.');
      } else {
        await kidsClient.homeworks.submissions.create({
          homework_id: homework.id,
          student_id: studentId,
          answer_text: answerText,
          files: [],
        });
        toast('Ответ отправлен.');
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'Ошибка отправки';
      toast(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="kids">
      <h3 className="font-semibold text-primary">Ваш ответ</h3>
      <form onSubmit={handleSubmit} className="mt-4">
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          className="min-h-[120px] w-full rounded-lg border-2 border-primary/30 px-3 py-2 focus:border-primary focus:outline-none"
          placeholder="Введите ответ..."
          rows={5}
        />
        <p className="mt-2 text-sm text-gray-600">
          Прикрепление файлов: загрузите файл на любой хостинг и вставьте ссылку в текст ответа (в будущем можно добавить загрузку).
        </p>
        <Button type="submit" variant="kids" className="mt-4" loading={loading}>
          {existingSubmission ? 'Обновить ответ' : 'Отправить ответ'}
        </Button>
      </form>
    </Card>
  );
}
