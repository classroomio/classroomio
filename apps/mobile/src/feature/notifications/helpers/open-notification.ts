import { router } from 'expo-router';

import { hrefForDeepLink } from '@/feature/notifications/helpers/deep-link';
import { getActiveOrgId, setActiveOrg } from '@/feature/org/helpers/active-org-store';

/**
 * Opens the screen a notification points to, switching to its organization first when the person belongs to it.
 * Unknown links open the notification list.
 */
export function openNotificationTarget(params: {
  deepLink: string | null | undefined;
  orgId?: string | null;
  memberOrgIds: string[];
}) {
  const { deepLink, orgId, memberOrgIds } = params;
  if (orgId && orgId !== getActiveOrgId()) {
    if (!memberOrgIds.includes(orgId)) return;

    setActiveOrg(orgId);
  }

  router.push(hrefForDeepLink(deepLink) ?? '/notifications');
}
