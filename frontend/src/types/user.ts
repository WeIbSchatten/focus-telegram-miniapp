export type UserRole = 'admin' | 'moderator' | 'teacher' | 'student' | 'user';
export type UserStatus = string;

export interface FocusUser {
  id: string;
  email: string;
  fullName: string;
  /** Список ролей пользователя. */
  roles: UserRole[];
  status: UserStatus;
  hasKidsAccess: boolean;
  hasSenseAccess?: boolean;
  /** Привязка Telegram: id пользователя в Telegram (если привязан). */
  telegramUserId?: string;
}

/** Главная роль для проверок (админ > модератор > учитель > ученик > пользователь). */
export function getPrimaryRole(roles: UserRole[] | undefined): UserRole {
  if (!roles?.length) return 'user';
  const order: UserRole[] = ['admin', 'moderator', 'teacher', 'student', 'user'];
  for (const r of order) {
    if (roles.includes(r)) return r;
  }
  return 'user';
}

/** Есть ли у пользователя указанная роль. */
export function hasRole(user: Pick<FocusUser, 'roles'> | null | undefined, role: UserRole): boolean {
  return Boolean(user?.roles?.includes(role));
}
