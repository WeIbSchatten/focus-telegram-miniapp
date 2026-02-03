export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/** ФИО: минимум 3 части (фамилия, имя, отчество), разделённые пробелами. */
export function isValidFullName(value: string): boolean {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 3;
}

export const FULL_NAME_HINT = 'Введите ФИО полностью: фамилия, имя, отчество';
