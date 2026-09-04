import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';

import { snackbar } from '$features/ui/snackbar/store';
import type { AcceptOrgInviteRequest, GetPendingInvitesRequest, PendingOrgInviteItem } from '../utils/types';

class PendingInvitesApi extends BaseApiWithErrors {
  invites = $state<PendingOrgInviteItem[]>([]);
  acceptingInviteId = $state<string | null>(null);
  /** False until the first fetch settles, so callers can tell "empty" from "not loaded yet". */
  hasLoaded = $state(false);
  private hasRequested = false;

  get count() {
    return this.invites.length;
  }

  /** Fetches once per page load. Call from a component's mount — there is no polling. */
  async fetchOnce() {
    if (this.hasRequested) return;

    this.hasRequested = true;
    await this.fetchPendingInvites();
  }

  async fetchPendingInvites() {
    await this.execute<GetPendingInvitesRequest>({
      requestFn: () => classroomio.account.invites.$get(),
      logContext: 'fetching pending organization invites',
      onSuccess: (response) => {
        this.invites = response.data ?? [];
      },
      onError: () => {
        this.invites = [];
      }
    });

    this.hasLoaded = true;
  }

  /**
   * Drops an invite that was accepted elsewhere (the shared modal posts directly), so the
   * bell count is right immediately instead of waiting on the next page load.
   */
  removeInvite(inviteId: string) {
    this.invites = this.invites.filter((invite) => invite.id !== inviteId);
  }

  /** Accepts an invite and returns where the caller should navigate, if anywhere. */
  async acceptInvite(inviteId: string): Promise<string | null> {
    this.acceptingInviteId = inviteId;
    let redirectTo: string | null = null;

    await this.execute<AcceptOrgInviteRequest>({
      requestFn: () => classroomio.invite.organization[':inviteId']['accept-by-id'].$post({ param: { inviteId } }),
      logContext: 'accepting organization invite',
      onSuccess: (response) => {
        this.invites = this.invites.filter((invite) => invite.id !== inviteId);
        redirectTo = response.data?.redirectTo ?? null;
        snackbar.success('invite.organization.messages.joined');
      },
      onError: () => {
        snackbar.error('invite.organization.messages.join_failed');
      }
    });

    this.acceptingInviteId = null;

    return redirectTo;
  }
}

export const pendingInvitesApi = new PendingInvitesApi();
