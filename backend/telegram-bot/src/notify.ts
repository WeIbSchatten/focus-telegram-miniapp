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
  const footer = '\n\n👉 Открой Focus Kids в боте, чтобы посмотреть.';
  switch (type) {
    case 'new_homework': {
      const title = payload.homework_title ?? 'Без названия';
      const desc = payload.homework_description?.trim();
      const text = desc ? `«${title}». ${desc}` : `«${title}».`;
      return `📝 <b>Новое домашнее задание</b>${program}\n\n${text}${footer}`;
    }
    case 'lesson_grades':
      return `📊 <b>Оценки за занятие</b>${payload.lesson_date ? ` (${payload.lesson_date})` : ''}\n\nВыставлены оценки.${footer}`;
    case 'new_grade':
      return `📊 <b>Оценка за занятие</b>${payload.lesson_date ? ` (${payload.lesson_date})` : ''}\n\nОценка: ${payload.grade_value ?? '—'}.${footer}`;
    case 'new_test':
      return `📋 <b>Новый тест</b>${program}\n\n«${payload.test_title ?? 'Без названия'}»${footer}`;
    case 'new_video':
      return `🎬 <b>Новое видео</b>${program}\n\n«${payload.lecture_title ?? 'Без названия'}»${footer}`;
    default:
      return `Уведомление от Focus Kids. Открой приложение для просмотра.`;
  }
}
