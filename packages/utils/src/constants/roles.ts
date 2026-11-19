export const ROLE = {
  ADMIN: 1,
  TUTOR: 2,
  STUDENT: 3
} as const;

export const INSTRUCTOR_ROLE_LABEL = {
  TUTOR: 'Tutor',
  INSTRUCTOR: 'Instructor'
} as const;

export const ROLE_LABELS: Record<number, string> = {
  [ROLE.ADMIN]: 'admin',
  [ROLE.TUTOR]: 'tutor',
  [ROLE.STUDENT]: 'student'
};
