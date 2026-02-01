export interface Program {
  id: number;
  name: string;
  description: string | null;
  group_id: number;
  /** Present when loaded via programs.get(id); list endpoint returns programs without these. */
  lectures?: Lecture[];
  homeworks?: Homework[];
  tests?: Test[];
}

/** Программа с количеством элементов (endpoint /programs/with-counts/). */
export interface ProgramWithCounts extends Program {
  lectures_count: number;
  homeworks_count: number;
  tests_count: number;
  /** Проведённых занятий по этой программе (уроки с выбранной темой). */
  lessons_count: number;
}

export interface Lecture {
  id: number;
  program_id: number;
  title: string;
  description: string | null;
  rutube_video_id: string | null;
  video_type: 'youtube' | 'vk' | 'rutube';
  video_id: string | null;
  order: number;
}

export interface HomeworkFile {
  id: number;
  file_url: string;
  file_name: string;
}

export interface Homework {
  id: number;
  program_id: number;
  title: string;
  description: string | null;
  order: number;
  files: HomeworkFile[];
}

export interface TestAnswer {
  id: number;
  question_id: number;
  answer_text: string;
  is_correct: boolean;
  order: number;
}

export interface TestQuestion {
  id: number;
  test_id: number;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'text';
  order: number;
  answers: TestAnswer[];
}

export interface Test {
  id: number;
  program_id: number;
  title: string;
  description: string | null;
  order: number;
  /** Сколько попыток разрешено (null = неограниченно). */
  max_attempts?: number | null;
  questions: TestQuestion[];
}

export interface Group {
  id: number;
  name: string;
  level: string | null;
  teacher_id: number;
  teacher?: { id: number; full_name: string };
  students?: { id: number; full_name: string }[];
}

export interface Student {
  id: number;
  full_name: string;
  focus_user_id: string;
  group_id: number | null;
}

export interface HomeworkSubmission {
  id: number;
  homework_id: number;
  student_id: number;
  answer_text: string | null;
  grade: number | null;
  teacher_comment: string | null;
  files: { id: number; file_url: string; file_name: string }[];
  comments: { id: number; comment_text: string; author_id: number }[];
}

export interface TestSubmission {
  id: number;
  test_id: number;
  student_id: number;
  score: number | null;
  max_score: number | null;
  is_approved_for_retake: boolean;
  answers: { id: number; question_id: number; answer_text: string | null; selected_answer_ids: string | null }[];
}

export interface StudentStatistics {
  student_id: number;
  total_lessons: number;
  attended_lessons: number;
  attendance_rate: number;
  average_grade: number | null;
  total_grades: number;
  completed_homeworks: number;
  total_homeworks: number;
  completed_tests: number;
  total_tests: number;
  average_test_score: number | null;
}

export interface TeacherGroupStatistics {
  group_id: number;
  group_name: string;
  total_students: number;
  average_attendance_rate: number;
  average_grade: number | null;
  total_lessons: number;
}

export interface TeacherStatistics {
  teacher_id: number;
  total_groups: number;
  total_students: number;
  groups: TeacherGroupStatistics[];
}

/** Оценка / обратная связь (устное ДЗ, письменное ДЗ, диктант, работа на уроке, ДЗ на следующий урок) */
export interface Grade {
  id: number;
  student_id: number;
  group_id: number;
  lesson_date: string | null;
  value: number;
  type: string;
  comment: string | null;
  program_id?: number | null;
}

/** Типы обратной связи по занятию */
export const GRADE_TYPES = {
  oral_hw: 'ДЗ устное',
  written_hw: 'ДЗ письменное',
  dictation: 'Диктант',
  classwork: 'Работа на уроке',
  homework_next: 'ДЗ на следующий урок',
  teacher_comment: 'Комментарий',
} as const;
