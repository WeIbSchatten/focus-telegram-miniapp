export type UserRole = 'admin' | 'moderator' | 'teacher' | 'student' | 'user';
export type UserStatus = string;

export interface FocusUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  hasKidsAccess: boolean;
  hasSenseAccess?: boolean;
  /** Привязка Telegram: id пользователя в Telegram (если привязан). */
  telegramUserId?: string;
}
