import type { BadgeVariant } from '@cio/ui/base/badge';

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
