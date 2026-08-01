import dayjs from 'dayjs';
import type { CourseMember } from '$features/course/utils/types';
import { ROLE } from '@cio/utils/constants';

export type CourseMemberStage = NonNullable<CourseMember['stage']>;

export function formatPeopleShortDate(value: string | null | undefined): string {
  if (!value) return '—';

  const date = dayjs(value);
  if (!date.isValid()) return '—';

  return date.format('MMM D, YYYY');
}

export function isStudentMember(member: CourseMember): boolean {
  return member.roleId === ROLE.STUDENT && !!member.profileId;
}

export function getMemberProgressPercent(member: CourseMember): number | null {
  if (!isStudentMember(member)) {
    return null;
  }

  return member.progressPercent ?? 0;
}

export function getMemberAvatarUrl(member: CourseMember): string {
  return member.profile?.avatarUrl ?? '';
}

export function obscureMemberEmail(email: string | null | undefined): string {
  if (!email) return '';

  const [username, domain] = email.split('@');
  if (!username || !domain) return email;

  if (username.length <= 2) {
    return `${username.charAt(0)}*@${domain}`;
  }

  const obscuredUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);

  return `${obscuredUsername}@${domain}`;
}
