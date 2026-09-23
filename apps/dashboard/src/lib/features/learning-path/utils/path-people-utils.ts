import dayjs from 'dayjs';
import { ROLE } from '@cio/utils/constants';
import { t } from '$lib/utils/functions/translations';
import type { LearningPathMemberItem, ListPathMembersRequestQuery, PathMembersListOptions } from './types';
export const DEFAULT_PATH_PEOPLE_PAGE_SIZE = 20;

/** Role filter value that means "every role" and so sends no roleId to the API. */
export const ALL_ROLES_FILTER = 'all';

/** The API reads pagination and filters from the query string, so numbers go over the wire as strings. */
export function toPathMembersRequestQuery(options: PathMembersListOptions): ListPathMembersRequestQuery {
  const { page, limit, status, roleId, search } = options;

  return {
    page: String(page),
    limit: String(limit),
    ...(status ? { status } : {}),
    ...(roleId === undefined ? {} : { roleId: String(roleId) }),
    ...(search ? { search } : {})
  };
}

export function formatPathShortDate(value: string | null | undefined): string {
  if (!value) return '—';

  const date = dayjs(value);
  if (!date.isValid()) return '—';

  return date.format('MMM D, YYYY');
}

export function isPathStudentMember(member: LearningPathMemberItem): boolean {
  return member.roleId === ROLE.STUDENT && !!member.profileId;
}

export function getPathMemberProgressPercent(member: LearningPathMemberItem): number | null {
  if (!isPathStudentMember(member)) {
    return null;
  }

  return member.progressPercent ?? 0;
}

export function getPathMemberDisplayEmail(member: LearningPathMemberItem): string {
  return member.profileEmail ?? member.email ?? '';
}

export function obscurePathMemberEmail(email: string | null | undefined): string {
  if (!email) return '';

  const [username, domain] = email.split('@');
  if (!username || !domain) return email;

  if (username.length <= 2) {
    return `${username.charAt(0)}*@${domain}`;
  }

  const obscuredUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);

  return `${obscuredUsername}@${domain}`;
}

/** Row clicks on interactive descendants must not trigger row navigation. */
export function shouldIgnoreRowNavigation(event: Event): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(target.closest('button, a, [data-slot="dropdown-menu-trigger"], [data-slot="dropdown-menu-content"]'));
}

export function getPathCourseStatusLabel(status: string): string {
  if (status === 'COMPLETED') return t.get('learningPath.analytics.member.status.completed');
  if (status === 'IN_PROGRESS') return t.get('learningPath.analytics.member.status.in_progress');
  if (status === 'LOCKED') return t.get('learningPath.analytics.member.status.locked');

  return t.get('learningPath.analytics.member.status.not_started');
}

/**
 * Formats a completion ratio like course score badges (`8/10`).
 * Guards both ends: no total → `—`; no completed count → `—/total`.
 */
export function formatCompletionRatio(completed: number | null | undefined, total: number | null | undefined): string {
  if (total === null || total === undefined || Number.isNaN(total) || total <= 0) return '—';
  if (completed === null || completed === undefined || Number.isNaN(completed)) return `—/${total}`;

  return `${completed}/${total}`;
}

/** Splits bulk-pasted emails (comma or newline separated) into clean lowercase addresses. */
export function parseInviteEmails(csv: string): string[] {
  return csv
    .split(/[\n,]+/)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}
