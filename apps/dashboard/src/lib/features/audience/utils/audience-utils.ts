import type { BadgeVariant } from '@cio/ui/base/badge';
import { calDateDiff } from '$lib/utils/functions/date';
import type { OrganizationAudienceMemberStatus } from '$features/org/utils/types';
import { t } from '$lib/utils/functions/translations';

/** `null` when absent, so the caller can render a translated "Never". */
export function formatActivityAge(timestamp: string | null | undefined): string | null {
  if (!timestamp) {
    return null;
  }

  const parsed = new Date(timestamp);

  return Number.isNaN(parsed.getTime()) ? null : calDateDiff(parsed);
}

/** Exact date, for the column's hover title. */
export function formatActivityExact(timestamp: string | null | undefined): string | undefined {
  if (!timestamp) {
    return undefined;
  }

  const parsed = new Date(timestamp);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toLocaleString();
}

export function memberStatusBadgeVariant(status: OrganizationAudienceMemberStatus): BadgeVariant {
  switch (status) {
    case 'DEACTIVATED':
      return 'destructive';
    case 'ARCHIVED':
      return 'outline';
    default:
      return 'secondary';
  }
}

export function memberStatusLabelKey(status: OrganizationAudienceMemberStatus): string {
  switch (status) {
    case 'DEACTIVATED':
      return 'audience.filter.status_deactivated';
    case 'ARCHIVED':
      return 'audience.filter.status_archived';
    default:
      return 'audience.filter.status_active';
  }
}

export function statusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'active':
      return 'secondary';
    case 'pending':
      return 'outline';
    case 'expired':
    case 'revoked':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function statusLabelKey(status: string): string {
  switch (status) {
    case 'active':
      return 'audience.status_active';
    case 'pending':
      return 'audience.status_pending';
    case 'expired':
      return 'audience.status_expired';
    case 'revoked':
      return 'audience.status_revoked';
    default:
      return 'audience.status_pending';
  }
}

export function canResendAudienceInvite(status: string): boolean {
  return status === 'pending' || status === 'expired' || status === 'revoked';
}

export function canRevokeAudienceInvite(status: string): boolean {
  return status === 'pending';
}

export function formatLastSeen(lastSeen: string | null | undefined): string {
  if (!lastSeen) return t.get('analytics.a_while_ago');

  const date = new Date(lastSeen);
  if (Number.isNaN(date.getTime())) return t.get('analytics.a_while_ago');

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return t.get('analytics.just_now');
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return t.get('analytics.minutes_ago', { count: minutes });
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return t.get('analytics.hours_ago', { count: hours });
  }
  if (seconds < 2592000) {
    const days = Math.floor(seconds / 86400);
    return t.get('analytics.days_ago', { count: days });
  }
  if (seconds < 31536000) {
    const months = Math.floor(seconds / 2592000);
    return t.get('analytics.months_ago', { count: months });
  }

  const years = Math.floor(seconds / 31536000);
  return t.get('analytics.years_ago', { count: years });
}
