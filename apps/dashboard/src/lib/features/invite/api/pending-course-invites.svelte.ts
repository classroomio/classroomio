import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';

import { snackbar } from '$features/ui/snackbar/store';
import type {
  AcceptCourseInviteRequest,
  GetPendingCourseInvitesRequest,
  PendingCourseInviteItem
} from '../utils/types';

class PendingCourseInvitesApi extends BaseApiWithErrors {
  invites = $state<PendingCourseInviteItem[]>([]);
  acceptingInviteId = $state<string | null>(null);
  hasLoaded = $state(false);
  isModalOpen = $state(false);
  private hasRequested = false;

  get count() {
    return this.invites.length;
  }

  /** Fetches once per page load; call it only after the session's profile is known. */
  async fetchOnce() {
    if (this.hasRequested) return;

    this.hasRequested = true;
    await this.fetchPendingInvites();
  }

  async fetchPendingInvites() {
    await this.execute<GetPendingCourseInvitesRequest>({
      requestFn: () => classroomio.account['course-invites'].$get(),
      logContext: 'fetching pending course invites',
      onSuccess: (response) => {
        this.invites = response.data ?? [];
      },
      onError: () => {
        this.invites = [];
      }
    });

    this.hasLoaded = true;
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  /** Accepts an invite and returns where the caller should navigate, if anywhere. */
  async acceptInvite(inviteId: string): Promise<string | null> {
    this.acceptingInviteId = inviteId;
    let redirectTo: string | null = null;

    await this.execute<AcceptCourseInviteRequest>({
      requestFn: () => classroomio.invite.student[':inviteId']['accept-by-id'].$post({ param: { inviteId } }),
      logContext: 'accepting course invite',
      onSuccess: (response) => {
        this.invites = this.invites.filter((invite) => invite.id !== inviteId);
        redirectTo = response.data?.redirectTo ?? null;
        snackbar.success('invite.course.messages.joined');
      },
      onError: () => {
        snackbar.error('invite.course.messages.join_failed');
      }
    });

    this.acceptingInviteId = null;

    return redirectTo;
  }
}

export const pendingCourseInvitesApi = new PendingCourseInvitesApi();
