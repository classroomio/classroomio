import type { BadgeVariant } from '@cio/ui/base/badge';
import { t } from '$lib/utils/functions/translations';

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
  if (!lastSeen) return t.get('analytics.a_while_ago') ?? 'a while ago';

  const date = new Date(lastSeen);
  if (Number.isNaN(date.getTime())) return t.get('analytics.a_while_ago') ?? 'a while ago';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return t.get('analytics.just_now') ?? 'just now';
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (seconds < 2592000) {
    // ~30 days
    const days = Math.floor(seconds / 86400);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (seconds < 31536000) {
    // ~365 days
    const months = Math.floor(seconds / 2592000);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }

  const years = Math.floor(seconds / 31536000);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}
