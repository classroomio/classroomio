import dayjs from 'dayjs';
import type { CourseMember, ListPeopleQuery, ListPeopleRequestQuery } from '$features/course/utils/types';
import { ROLE } from '@cio/utils/constants';

export type CourseMemberStage = NonNullable<CourseMember['stage']>;

export const DEFAULT_PEOPLE_PAGE_SIZE = 20;

/** Role filter value that means "every role" and so sends no roleId to the API. */
export const ALL_ROLES_FILTER = 'all';

/** The API reads pagination and filters from the query string, so numbers go over the wire as strings. */
export function toPeopleRequestQuery(query: ListPeopleQuery): ListPeopleRequestQuery {
  return {
    page: String(query.page),
    limit: String(query.limit),
    search: query.search,
    roleId: query.roleId === undefined ? undefined : String(query.roleId)
  };
}

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
