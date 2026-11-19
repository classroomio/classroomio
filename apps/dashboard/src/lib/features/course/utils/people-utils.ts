import dayjs from 'dayjs';
import type { CourseMember, ListPeopleQuery, ListPeopleRequestQuery } from '$features/course/utils/types';
import { ROLE } from '@cio/utils/constants';
import { ROLE_LABEL } from '$lib/utils/constants/roles';

/**
 * The member shape that carries progress fields (progress percent, stage,
 * last login and enrollment date). Only student rows with an account hold
 * meaningful values there, whatever the API sends for other roles, so
 * consumers must narrow with `isStudentMember` before reading them.
 */
export type CourseMemberStage = NonNullable<Extract<CourseMember, { stage: unknown }>['stage']>;

type CourseMemberWithProgress = Extract<CourseMember, { progressPercent: number }> & { stage?: CourseMemberStage };

export const DEFAULT_PEOPLE_PAGE_SIZE = 20;

/** Role filter value that means "every role" and so sends no roleId to the API. */
export const ALL_ROLES_FILTER = 'all';

/** The API reads pagination and filters from the query string, so numbers and booleans go over the wire as strings. */
export function toPeopleRequestQuery(query: ListPeopleQuery): ListPeopleRequestQuery {
  return {
    page: String(query.page),
    limit: String(query.limit),
    search: query.search,
    roleId: query.roleId === undefined ? undefined : String(query.roleId),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    progress: query.progress,
    membership: query.membership,
    enrolledWithin: query.enrolledWithin,
    lastLoginBefore: query.lastLoginBefore,
    certificateEarned: query.certificateEarned === undefined ? undefined : String(query.certificateEarned),
    source: query.source
  } as ListPeopleRequestQuery;
}

export function formatPeopleShortDate(value: string | null | undefined): string {
  if (!value) return '—';

  const date = dayjs(value);
  if (!date.isValid()) return '—';

  return date.format('MMM D, YYYY');
}

/** Narrows to a student with an account, the only member whose progress fields are meaningful. */
export function isStudentMember(member: CourseMember): member is CourseMemberWithProgress {
  return member.roleId === ROLE.STUDENT && !!member.profileId;
}

/**
 * Returns the translation key for the member's course role, or undefined when unknown.
 */
export function getMemberRoleLabel(member: CourseMember): string | undefined {
  if (!member.roleId) return undefined;

  return ROLE_LABEL[member.roleId as keyof typeof ROLE_LABEL];
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
