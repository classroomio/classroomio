import { ROLE } from '@cio/utils/constants';

export const ROLE_LABEL = {
  [ROLE.ADMIN]: 'course.navItem.people.roles.admin',
  [ROLE.TUTOR]: 'course.navItem.people.roles.tutor',
  [ROLE.STUDENT]: 'course.navItem.people.roles.student'
};

export const ROLES = [
  {
    label: 'course.navItem.people.roles.filter',
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
