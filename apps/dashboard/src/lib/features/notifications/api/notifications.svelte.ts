import { pendingCourseInvitesApi } from '$features/invite/api/pending-course-invites.svelte';
import { pendingInvitesApi } from '$features/invite/api/pending-invites.svelte';
import { toCourseInviteNotifications, toInviteNotifications } from '$features/invite/utils/invite-notification-utils';
import { sortNewestFirst } from '../utils/notification-utils';

/**
 * Single seam the bell badge and the panel list both read, so a new notification kind
 * cannot leave the badge under-counting.
 */
class NotificationsApi {
  items = $derived(
    sortNewestFirst([
      ...toInviteNotifications(pendingInvitesApi.invites),
      ...toCourseInviteNotifications(pendingCourseInvitesApi.invites)
    ])
  );
  unreadCount = $derived(this.items.filter((item) => item.unread).length);

  get isLoading() {
    return pendingInvitesApi.isLoading || pendingCourseInvitesApi.isLoading;
  }

  get hasLoaded() {
    return pendingInvitesApi.hasLoaded && pendingCourseInvitesApi.hasLoaded;
  }

  fetchOnce() {
    return Promise.all([pendingInvitesApi.fetchOnce(), pendingCourseInvitesApi.fetchOnce()]);
  }

  refresh() {
    return Promise.all([pendingInvitesApi.fetchPendingInvites(), pendingCourseInvitesApi.fetchPendingInvites()]);
  }
}

export const notificationsApi = new NotificationsApi();
