import type { NotificationItem } from '$features/notifications/utils/types';
import type { PendingOrgInviteItem } from './types';

/**
 * Adapts pending org invites into the generic notification model. Lives in the invite
 * feature so the notification panel never depends on a source domain.
 */
export function toInviteNotifications(invites: PendingOrgInviteItem[]): NotificationItem[] {
  return invites.map((invite) => ({
    id: `org_invite:${invite.id}`,
    kind: 'org_invite' as const,
    createdAt: invite.createdAt,
    title: { key: 'notifications.pending_invite.heading' },
    body: {
      key: 'notifications.pending_invite.body',
      params: { orgName: invite.organization.name, role: invite.roleLabel }
    },
    avatarUrl: invite.organization.avatarUrl,
    avatarName: invite.organization.name,
    unread: true,
    sourceId: invite.id
  }));
}
