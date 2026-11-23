import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { hrefForDeepLink, isWebDeepLink } from '@/feature/notifications/helpers/deep-link';
import { getActiveOrgId, setActiveOrg } from '@/feature/org/helpers/active-org-store';

/**
 * Opens the screen a notification points to, switching to its organization first when the person belongs to it.
 * Web dashboard links (billing, plan limits, integrations) open in the in-app browser; unknown links open the list.
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

  if (isWebDeepLink(deepLink)) {
    void WebBrowser.openBrowserAsync(deepLink, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET
    });
    return;
  }

  router.push(hrefForDeepLink(deepLink) ?? '/notifications');
}
