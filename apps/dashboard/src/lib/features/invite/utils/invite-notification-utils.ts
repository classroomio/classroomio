import { ROLE } from '@cio/utils/constants';

import type { NotificationItem } from '$features/notifications/utils/types';
import type { PendingOrgInviteItem } from './types';

/**
 * The API's `roleLabel` is built server-side in English. Map the id to a translation key
 * instead so a Danish reader does not get "Admin" in an otherwise Danish sentence.
 */
const ROLE_LABEL_KEYS: Record<number, string> = {
  [ROLE.ADMIN]: 'course.navItem.people.roles.admin',
  [ROLE.TUTOR]: 'course.navItem.people.roles.tutor',
  [ROLE.STUDENT]: 'course.navItem.people.roles.student'
};

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
      params: { orgName: invite.organization.name },
      keyParams: { role: ROLE_LABEL_KEYS[invite.roleId] ?? 'course.navItem.people.roles.student' }
    },
    avatarUrl: invite.organization.avatarUrl,
    avatarName: invite.organization.name,
    unread: true,
    sourceId: invite.id
  }));
}
