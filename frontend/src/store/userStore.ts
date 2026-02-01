import { create } from 'zustand';
import type { FocusUser } from '@/types/user';

interface UserState {
  profile: Pick<FocusUser, 'id' | 'email' | 'fullName' | 'role' | 'status' | 'hasKidsAccess'> | null;
  setProfile: (profile: UserState['profile']) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}));
