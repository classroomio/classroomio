import { ROLE } from '@cio/utils/constants/roles';

export const ROLE_NAME_KEYS: Record<number, 'roleAdmin' | 'roleTutor' | 'roleStudent'> = {
  [ROLE.ADMIN]: 'roleAdmin',
  [ROLE.TUTOR]: 'roleTutor',
  [ROLE.STUDENT]: 'roleStudent'
};
