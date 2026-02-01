/**
 * Форматирование текста уведомлений для Focus Kids.
 */
export type NotifyType = 'new_homework' | 'new_grade' | 'lesson_grades' | 'new_test' | 'new_video';

export interface NotifyPayload {
  program_name?: string;
  homework_title?: string;
  homework_description?: string;
  lecture_title?: string;
  test_title?: string;
  grade_value?: number;
  grade_type?: string;
  lesson_date?: string;
}

export function formatNotifyMessage(type: NotifyType, payload: NotifyPayload): string {
  const program = payload.program_name ? ` по программе «${payload.program_name}»` : '';
  switch (type) {
    case 'new_homework': {
      const title = payload.homework_title ?? 'Без названия';
      const desc = payload.homework_description?.trim();
      const text = desc ? `«${title}». ${desc}` : `«${title}».`;
      return `📝 Новое домашнее задание${program}: ${text} Открой Focus Kids и выполни задание.`;
    }
    case 'lesson_grades':
      return `📊 За занятие${payload.lesson_date ? ` (${payload.lesson_date})` : ''} выставлены оценки. Открой Focus Kids, чтобы посмотреть детали.`;
    case 'new_grade':
      return `📊 Оценка за занятие${payload.lesson_date ? ` (${payload.lesson_date})` : ''}: ${payload.grade_value ?? '—'}. Открой Focus Kids, чтобы посмотреть детали.`;
    case 'new_test':
      return `📋 Новый тест${program}: «${payload.test_title ?? 'Без названия'}». Открой Focus Kids и пройди тест.`;
    case 'new_video':
      return `🎬 Новое видео${program}: «${payload.lecture_title ?? 'Без названия'}». Открой Focus Kids и посмотри.`;
    default:
      return `Уведомление от Focus Kids. Открой приложение для просмотра.`;
  }
}
