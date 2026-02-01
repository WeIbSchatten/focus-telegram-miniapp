import { kidsApi } from './axios';
import type {
  Program,
  ProgramWithCounts,
  Lecture,
  Homework,
  Test,
  Group,
  Student,
  HomeworkSubmission,
  TestSubmission,
  StudentStatistics,
  TeacherStatistics,
  Grade,
} from '@/types/kids';

export const kidsClient = {
  programs: {
    list: () => kidsApi.get<Program[]>('/programs/').then((r) => r.data),
    /** Список программ с полями lectures_count, homeworks_count, tests_count для страницы «Обучение». */
    listWithCounts: () =>
      kidsApi.get<ProgramWithCounts[]>('/programs/with-counts/').then((r) => r.data),
    listByGroup: (groupId: number) =>
      kidsApi.get<Program[]>(`/programs/by-group/${groupId}`).then((r) => r.data),
    get: (id: number) => kidsApi.get<Program>(`/programs/${id}`).then((r) => r.data),
    create: (data: { name: string; description?: string | null; group_id: number }) =>
      kidsApi.post<Program>('/programs/', data).then((r) => r.data),
    update: (id: number, data: { name?: string; description?: string | null }) =>
      kidsApi.patch<Program>(`/programs/${id}`, data).then((r) => r.data),
    delete: (id: number) => kidsApi.delete(`/programs/${id}`).then(() => undefined),
  },
  lectures: {
    list: () => kidsApi.get<Lecture[]>('/lectures/').then((r) => r.data),
    listByProgram: (programId: number) =>
      kidsApi.get<Lecture[]>(`/lectures/by-program/${programId}`).then((r) => r.data),
    get: (id: number) => kidsApi.get<Lecture>(`/lectures/${id}`).then((r) => r.data),
    getEmbed: (id: number, width = 720, height = 405) =>
      kidsApi.get<{ embed_url: string | null; embed_html: string | null; video_id: string | null; video_type?: string; watch_url: string | null }>(
        `/lectures/${id}/embed`,
        { params: { width, height } }
      ).then((r) => r.data),
    create: (data: { program_id: number; title: string; description?: string | null; video_url?: string | null; video_type?: string; video_id?: string | null; order?: number }) =>
      kidsApi.post<Lecture>('/lectures/', data).then((r) => r.data),
    update: (id: number, data: { title?: string; description?: string | null; video_url?: string | null; video_type?: string; video_id?: string | null; order?: number }) =>
      kidsApi.patch<Lecture>(`/lectures/${id}`, data).then((r) => r.data),
    delete: (id: number) => kidsApi.delete(`/lectures/${id}`).then(() => undefined),
  },
  homeworks: {
    list: () => kidsApi.get<Homework[]>('/homeworks/').then((r) => r.data),
    listByProgram: (programId: number) =>
      kidsApi.get<Homework[]>(`/homeworks/by-program/${programId}`).then((r) => r.data),
    get: (id: number) => kidsApi.get<Homework>(`/homeworks/${id}`).then((r) => r.data),
    submissions: {
      create: (data: {
        homework_id: number;
        student_id: number;
        answer_text?: string;
        files?: { file_url: string; file_name: string }[];
      }) => kidsApi.post<HomeworkSubmission>('/homeworks/submissions', data).then((r) => r.data),
      listByHomework: (homeworkId: number) =>
        kidsApi.get<HomeworkSubmission[]>(`/homeworks/submissions/by-homework/${homeworkId}`).then((r) => r.data),
      listByStudent: (studentId: number) =>
        kidsApi.get<HomeworkSubmission[]>(`/homeworks/submissions/by-student/${studentId}`).then((r) => r.data),
      update: (submissionId: number, data: { answer_text?: string; grade?: number; teacher_comment?: string }) =>
        kidsApi.patch<HomeworkSubmission>(`/homeworks/submissions/${submissionId}`, data).then((r) => r.data),
    },
    createComment: (submissionId: number, data: { author_id: number; comment_text: string }) =>
      kidsApi.post(`/homeworks/submissions/${submissionId}/comments`, data).then((r) => r.data),
  },
  tests: {
    list: () => kidsApi.get<Test[]>('/tests/').then((r) => r.data),
    listByProgram: (programId: number) =>
      kidsApi.get<Test[]>(`/tests/by-program/${programId}`).then((r) => r.data),
    get: (id: number) => kidsApi.get<Test>(`/tests/${id}`).then((r) => r.data),
    update: (id: number, data: { title?: string; description?: string | null; order?: number; max_attempts?: number | null }) =>
      kidsApi.patch<Test>(`/tests/${id}`, data).then((r) => r.data),
    create: (data: {
      program_id: number;
      title: string;
      description?: string | null;
      order?: number;
      max_attempts?: number | null;
      questions: {
        question_text: string;
        question_type: string;
        order: number;
        answers: { answer_text: string; is_correct: boolean; order: number }[];
      }[];
    }) => kidsApi.post<Test>('/tests/', data).then((r) => r.data),
    submissions: {
      create: (data: {
        test_id: number;
        student_id: number;
        answers: { question_id: number; answer_text?: string; selected_answer_ids?: string }[];
      }) => kidsApi.post<TestSubmission>('/tests/submissions', data).then((r) => r.data),
      listByTest: (testId: number) =>
        kidsApi.get<TestSubmission[]>(`/tests/submissions/by-test/${testId}`).then((r) => r.data),
      listByStudent: (studentId: number) =>
        kidsApi.get<TestSubmission[]>(`/tests/submissions/by-student/${studentId}`).then((r) => r.data),
      /** Лучшая попытка по каждому тесту (для статистики и отображения ученику). */
      bestByStudent: (studentId: number) =>
        kidsApi.get<TestSubmission[]>(`/tests/submissions/best-by-student/${studentId}`).then((r) => r.data),
      update: (submissionId: number, data: { is_approved_for_retake?: boolean }) =>
        kidsApi.patch<TestSubmission>(`/tests/submissions/${submissionId}`, data).then((r) => r.data),
    },
  },
  groups: {
    list: () => kidsApi.get<Group[]>('/groups/').then((r) => r.data),
    get: (id: number) => kidsApi.get<Group>(`/groups/${id}`).then((r) => r.data),
    create: (data: { name: string; level?: string; teacher_id?: number }) =>
      kidsApi.post<Group>('/groups/', data).then((r) => r.data),
    update: (id: number, data: { name?: string; level?: string; teacher_id?: number }) =>
      kidsApi.patch<Group>(`/groups/${id}`, data).then((r) => r.data),
    delete: (id: number) => kidsApi.delete(`/groups/${id}`).then((r) => r.data),
    assignStudent: (groupId: number, studentId: number) =>
      kidsApi.post<Group>(`/groups/${groupId}/assign-student?student_id=${studentId}`).then((r) => r.data),
    unassignStudent: (groupId: number, studentId: number) =>
      kidsApi.delete<Group>(`/groups/${groupId}/students/${studentId}`).then((r) => r.data),
  },
  students: {
    list: () => kidsApi.get<Student[]>('/students/').then((r) => r.data),
    get: (id: number) => kidsApi.get<Student>(`/students/${id}`).then((r) => r.data),
    create: (data: { full_name: string; focus_user_id: string; group_id?: number }) =>
      kidsApi.post<Student>('/students/', data).then((r) => r.data),
    update: (id: number, data: { full_name?: string; group_id?: number | null }) =>
      kidsApi.patch<Student>(`/students/${id}`, data).then((r) => r.data),
  },
  teachers: {
    list: () => kidsApi.get<{ id: number; full_name: string; focus_user_id: string }[]>('/teachers/').then((r) => r.data),
    get: (id: number) => kidsApi.get<{ id: number; full_name: string; focus_user_id: string }>(`/teachers/${id}`).then((r) => r.data),
    create: (data: { full_name: string; focus_user_id: string }) =>
      kidsApi.post<{ id: number; full_name: string; focus_user_id: string }>('/teachers/', data).then((r) => r.data),
    update: (id: number, data: { full_name?: string }) =>
      kidsApi.patch<{ id: number; full_name: string; focus_user_id: string }>(`/teachers/${id}`, data).then((r) => r.data),
    delete: (id: number) => kidsApi.delete(`/teachers/${id}`).then((r) => r.data),
  },
  attendance: {
    listByStudent: (studentId: number) =>
      kidsApi.get<{ id: number; student_id: number; group_id: number; lesson_date: string; present: boolean; program_id?: number | null }[]>(
        `/attendance/by-student/${studentId}`
      ).then((r) => r.data),
    listByGroup: (groupId: number) =>
      kidsApi.get<{ id: number; student_id: number; group_id: number; lesson_date: string; present: boolean; program_id?: number | null }[]>(
        `/attendance/by-group/${groupId}`
      ).then((r) => r.data),
    create: (data: { student_id: number; group_id: number; lesson_date: string; present: boolean; program_id?: number | null }) =>
      kidsApi.post<{ id: number; student_id: number; group_id: number; lesson_date: string; present: boolean; program_id?: number | null }>(
        '/attendance/',
        data
      ).then((r) => r.data),
    update: (attendanceId: number, data: { present?: boolean; program_id?: number | null }) =>
      kidsApi.patch<{ id: number; student_id: number; group_id: number; lesson_date: string; present: boolean; program_id?: number | null }>(
        `/attendance/${attendanceId}`,
        data
      ).then((r) => r.data),
  },
  grades: {
    listByStudent: (studentId: number) =>
      kidsApi.get<Grade[]>(`/grades/by-student/${studentId}`).then((r) => r.data),
    listByGroup: (groupId: number) =>
      kidsApi.get<Grade[]>(`/grades/by-group/${groupId}`).then((r) => r.data),
    create: (data: {
      student_id: number;
      group_id: number;
      lesson_date?: string | null;
      value: number;
      type: string;
      comment?: string | null;
      program_id?: number | null;
    }) => kidsApi.post<Grade>('/grades/', data).then((r) => r.data),
    update: (gradeId: number, data: { lesson_date?: string | null; value?: number; type?: string; comment?: string | null; program_id?: number | null }) =>
      kidsApi.patch<Grade>(`/grades/${gradeId}`, data).then((r) => r.data),
    delete: (gradeId: number) => kidsApi.delete(`/grades/${gradeId}`).then(() => undefined),
    notifyForLesson: (groupId: number, lessonDate: string, programName?: string) =>
      kidsApi
        .post<void>('/grades/notify-for-lesson', { group_id: groupId, lesson_date: lessonDate, program_name: programName ?? undefined })
        .then(() => undefined),
  },
  statistics: {
    student: (studentId: number) =>
      kidsApi.get<StudentStatistics>(`/statistics/students/${studentId}`).then((r) => r.data),
    teacher: (teacherId: number) =>
      kidsApi.get<TeacherStatistics>(`/statistics/teachers/${teacherId}`).then((r) => r.data),
    groupOverview: (groupId: number) =>
      kidsApi.get(`/statistics/groups/${groupId}/overview`).then((r) => r.data),
  },
};
