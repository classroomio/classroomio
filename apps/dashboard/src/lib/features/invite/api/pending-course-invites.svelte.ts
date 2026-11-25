import { get } from 'svelte/store';

import { profile } from '$lib/utils/store/user';
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
  private requestedWhileVerified = false;

  get count() {
    return this.invites.length;
  }

  /**
   * Fetches once per page load, and again when the account becomes verified, because the API
   * returns nothing for an unverified account. Call it only after the profile is known.
   */
  async fetchOnce() {
    const isEmailVerified = get(profile).isEmailVerified;
    const becameVerified = isEmailVerified && !this.requestedWhileVerified;

    if (this.hasRequested && !becameVerified) return;

    this.hasRequested = true;
    this.requestedWhileVerified = isEmailVerified;
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
