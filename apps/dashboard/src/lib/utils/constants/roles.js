// import { t } from '../functions/translations.ts';

export const ROLE = {
  ADMIN: 1,
  TUTOR: 2,
  STUDENT: 3
};

export const ROLE_LABEL = {
  [ROLE.ADMIN]: 'Admin',
  [ROLE.TUTOR]: 'Tutor',
  [ROLE.STUDENT]: 'Student'
};

export const ROLES = [
  {
    label: 'Filter',
    value: 'all'
  },
  {
    label: ROLE_LABEL[ROLE.ADMIN],
    value: ROLE.ADMIN
  },
  {
    label: ROLE_LABEL[ROLE.TUTOR],
    value: ROLE.TUTOR
  },
  {
    label: ROLE_LABEL[ROLE.STUDENT],
    value: ROLE.STUDENT
  }
];
