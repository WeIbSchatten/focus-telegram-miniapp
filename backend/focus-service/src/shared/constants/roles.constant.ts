export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  TEACHER = 'teacher',
  STUDENT = 'student',
  USER = 'user',
}

/** Приоритет роли для JWT (выше = главнее). */
const ROLE_PRIORITY: Record<string, number> = {
  [UserRole.ADMIN]: 5,
  [UserRole.MODERATOR]: 4,
  [UserRole.TEACHER]: 3,
  [UserRole.STUDENT]: 2,
  [UserRole.USER]: 1,
};

/** Главная роль пользователя для JWT и проверок доступа. */
export function getPrimaryRole(roles: string[] | undefined): string {
  if (!roles?.length) return UserRole.USER;
  let maxPriority = 0;
  let primary: string = UserRole.USER;
  for (const r of roles) {
    const p = ROLE_PRIORITY[r] ?? 0;
    if (p > maxPriority) {
      maxPriority = p;
      primary = r;
    }
  }
  return primary;
}

/** Есть ли у пользователя указанная роль. */
export function hasRole(roles: string[] | undefined, role: string): boolean {
  return Array.isArray(roles) && roles.includes(role);
}

export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

