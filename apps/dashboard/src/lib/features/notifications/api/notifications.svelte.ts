import { pendingInvitationsApi } from '$features/invite/api/pending-invitations.svelte';
import { toPendingInvitationNotifications } from '$features/invite/utils/invite-notification-utils';
import { sortNewestFirst } from '../utils/notification-utils';

/**
 * Single seam the bell badge and the panel list both read, so a new notification kind
 * cannot leave the badge under-counting. Invitation notifications come from the unified
 * pending-invitations surface, which groups org and course invitations per organization.
 * (The legacy per-type invite apis stay for the org chooser and onboarding redirect.)
 */
class NotificationsApi {
  items = $derived(sortNewestFirst(toPendingInvitationNotifications(pendingInvitationsApi.groups)));
  unreadCount = $derived(this.items.filter((item) => item.unread).length);

  get isLoading() {
    return pendingInvitationsApi.isLoading;
  }

  get hasLoaded() {
    return pendingInvitationsApi.hasLoaded;
  }

  fetchOnce() {
    return pendingInvitationsApi.fetchOnce();
  }

  refresh() {
    return pendingInvitationsApi.fetchPendingInvitations();
  }
}

export const notificationsApi = new NotificationsApi();
