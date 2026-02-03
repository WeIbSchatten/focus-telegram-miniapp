import { senseApi } from './axios';
import type { Meditation, Affirmation, WeeklyIntention, DailyQuestion } from '@/types/sense';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('focus_access_token') || null;
}

/** Базовый URL для аудио (через прокси или прямой) */
function audioBase(): string {
  const base = process.env.NEXT_PUBLIC_SENSE_API_URL || '';
  return base ? `${base}/api` : '/api-sense';
}

export const senseClient = {
  meditations: {
    list: () => senseApi.get<Meditation[]>('/meditations/').then((r) => r.data),
    getAudioUrl: (id: number) => `${audioBase()}/meditations/${id}/audio?t=${getToken() || ''}`,
    create: (formData: FormData) =>
      senseApi.post<Meditation>('/meditations/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data),
    update: (id: number, data: { title?: string; order?: number }) =>
      senseApi.patch<Meditation>(`/meditations/${id}`, data).then((r) => r.data),
    delete: (id: number) => senseApi.delete(`/meditations/${id}`).then(() => undefined),
  },
  affirmations: {
    list: () => senseApi.get<Affirmation[]>('/affirmations/').then((r) => r.data),
    getAudioUrl: (id: number) => `${audioBase()}/affirmations/${id}/audio?t=${getToken() || ''}`,
    create: (formData: FormData) =>
      senseApi.post<Affirmation>('/affirmations/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data),
    update: (id: number, data: { title?: string; order?: number }) =>
      senseApi.patch<Affirmation>(`/affirmations/${id}`, data).then((r) => r.data),
    delete: (id: number) => senseApi.delete(`/affirmations/${id}`).then(() => undefined),
  },
  content: {
    weeklyIntention: () =>
      senseApi.get<WeeklyIntention | null>('/content/weekly-intention').then((r) => r.data),
    dailyQuestion: () =>
      senseApi.get<DailyQuestion | null>('/content/daily-question').then((r) => r.data),
    listWeeklyIntentions: () =>
      senseApi.get<WeeklyIntention[]>('/content/weekly-intentions').then((r) => r.data),
    replaceWeeklyIntentions: (items: string[]) =>
      senseApi.post<WeeklyIntention[]>('/content/weekly-intentions', { items }).then((r) => r.data),
    listDailyQuestions: () =>
      senseApi.get<DailyQuestion[]>('/content/daily-questions').then((r) => r.data),
    replaceDailyQuestions: (items: string[]) =>
      senseApi.post<DailyQuestion[]>('/content/daily-questions', { items }).then((r) => r.data),
  },
};
