import { create } from 'zustand';

export type KidsRole = 'teacher' | 'student' | null;

interface KidsState {
  role: KidsRole;
  teacherId: number | null;
  studentId: number | null;
  setKidsRole: (role: KidsRole, teacherId?: number, studentId?: number) => void;
}

export const useKidsStore = create<KidsState>((set) => ({
  role: null,
  teacherId: null,
  studentId: null,
  setKidsRole: (role, teacherId, studentId) =>
    set({
      role,
      teacherId: teacherId ?? null,
      studentId: studentId ?? null,
    }),
}));
