import type { Grade } from '@/types/kids';

const HOMEWORK_NEXT_TYPE = 'homework_next';
const ORAL_HW = 'oral_hw';
const WRITTEN_HW = 'written_hw';

interface AttendanceRecord {
  lesson_date: string;
}

/**
 * Уникальные даты занятий по посещаемости и оценкам (по возрастанию).
 */
function getLessonDatesAsc(attendance: AttendanceRecord[], grades: Grade[]): string[] {
  const dates = new Set<string>();
  attendance.forEach((a) => dates.add(a.lesson_date));
  grades.filter((g) => g.lesson_date).forEach((g) => dates.add(g.lesson_date!));
  return Array.from(dates).sort((a, b) => a.localeCompare(b));
}

/**
 * ДЗ (homework_next) считается «закрытым», если на следующем занятии
 * учитель поставил оценку за ДЗ (oral_hw или written_hw).
 * Иначе ДЗ остаётся «текущим» и показывается ученику.
 */
export function getPendingHomeworks(attendance: { lesson_date: string }[], grades: Grade[]): Grade[] {
  const homeworks = grades.filter((g) => g.type === HOMEWORK_NEXT_TYPE && g.lesson_date && g.comment?.trim());
  if (homeworks.length === 0) return [];

  const lessonDatesAsc = getLessonDatesAsc(attendance, grades);
  const pending: Grade[] = [];

  for (const hw of homeworks) {
    const assignedDate = hw.lesson_date!;
    const nextLessonIndex = lessonDatesAsc.findIndex((d) => d > assignedDate);
    const nextLessonDate = nextLessonIndex >= 0 ? lessonDatesAsc[nextLessonIndex] : null;

    if (!nextLessonDate) {
      // Следующего занятия ещё не было — ДЗ актуально
      pending.push(hw);
      continue;
    }

    // Есть следующее занятие: закрыто ли ДЗ оценкой за ДЗ на том занятии?
    const hasGradeOnNextLesson = grades.some(
      (g) =>
        g.lesson_date === nextLessonDate &&
        (g.type === ORAL_HW || g.type === WRITTEN_HW) &&
        g.student_id === hw.student_id
    );
    if (!hasGradeOnNextLesson) {
      // На следующем уроке не поставили оценку за ДЗ — задание не выполнено, показываем дальше
      pending.push(hw);
    }
  }

  return pending.sort((a, b) => (a.lesson_date || '').localeCompare(b.lesson_date || ''));
}
