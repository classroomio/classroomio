import { pendingInvitesApi } from '$features/invite/api/pending-invites.svelte';
import { toInviteNotifications } from '$features/invite/utils/invite-notification-utils';
import { sortNewestFirst } from '../utils/notification-utils';

/**
 * Single seam the bell badge and the panel list both read, so a new notification kind
 * cannot leave the badge under-counting.
 */
class NotificationsApi {
  items = $derived(sortNewestFirst(toInviteNotifications(pendingInvitesApi.invites)));
  unreadCount = $derived(this.items.filter((item) => item.unread).length);

  get isLoading() {
    return pendingInvitesApi.isLoading;
  }

  get hasLoaded() {
    return pendingInvitesApi.hasLoaded;
  }

  fetchOnce() {
    return pendingInvitesApi.fetchOnce();
  }

  refresh() {
    return pendingInvitesApi.fetchPendingInvites();
  }
}

export const notificationsApi = new NotificationsApi();
