import { ROLE } from '@cio/utils/constants';

import type { NotificationItem } from '$features/notifications/utils/types';
import type { PendingInvitationGroup } from './types';

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
 * Flattens grouped invitations into notification items: one per org invitation
 * plus one per directly emailed course invitation. Org-carried courses resolve
 * through the Join flow, so they do not get their own rows.
 */
export function toPendingInvitationNotifications(groups: PendingInvitationGroup[]): NotificationItem[] {
  return groups.flatMap((group) => {
    const items: NotificationItem[] = [];

    if (group.orgInvite) {
      items.push({
        id: `org_invite:${group.orgInvite.id}`,
        kind: 'org_invite' as const,
        createdAt: group.orgInvite.createdAt,
        title: { key: 'notifications.pending_invite.heading' },
        body: {
          key: 'notifications.pending_invite.body',
          params: { orgName: group.organization.name },
          keyParams: { role: ROLE_LABEL_KEYS[group.orgInvite.roleId] ?? 'course.navItem.people.roles.student' }
        },
        avatarUrl: group.organization.avatarUrl,
        avatarName: group.organization.name,
        unread: true,
        sourceId: group.orgInvite.id
      });
    }

    for (const course of group.courses) {
      if (!course.inviteId) continue;

      items.push({
        id: `course_invite:${course.inviteId}`,
        kind: 'course_invite' as const,
        createdAt: course.createdAt,
        title: { key: 'notifications.pending_course_invite.heading' },
        body: {
          key: 'notifications.pending_course_invite.body',
          params: { orgName: group.organization.name, courseTitle: course.title ?? '' }
        },
        avatarUrl: group.organization.avatarUrl,
        avatarName: group.organization.name,
        unread: true,
        sourceId: course.inviteId
      });
    }

    return items;
  });
}
