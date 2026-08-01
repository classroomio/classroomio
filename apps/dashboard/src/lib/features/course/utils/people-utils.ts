import dayjs from 'dayjs';
import type { CourseMember } from '$features/course/utils/types';
import { ROLE } from '@cio/utils/constants';

export type CourseMemberStage = NonNullable<CourseMember['stage']>;

export function formatPeopleShortDate(value: string | null | undefined): string {
  if (!value) return '—';

  const date = dayjs(value);
  if (!date.isValid()) return '—';

  return date.format('MMM D');
}

export function getMemberProgressPercent(member: CourseMember): number | null {
  if (member.roleId !== ROLE.STUDENT || !member.profileId) {
    return null;
  }

  return member.progressPercent ?? 0;
}

export function isStudentMember(member: CourseMember): boolean {
  return member.roleId === ROLE.STUDENT && !!member.profileId;
}
