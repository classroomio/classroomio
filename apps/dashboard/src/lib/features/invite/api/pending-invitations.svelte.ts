import { get } from 'svelte/store';
import { SvelteSet } from 'svelte/reactivity';

import { profile } from '$lib/utils/store/user';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { authClient } from '$lib/utils/services/auth/client';

import { snackbar } from '$features/ui/snackbar/store';
import type {
  AcceptOrgInviteRequest,
  GetPendingInvitationsRequest,
  JoinedCourseLink,
  JoinedOrgResult,
  PendingInvitationCourse,
  PendingInvitationGroup,
  PendingTenantInvite
} from '../utils/types';
import { buildJoinedCourseLinks, getJoinTarget } from '../utils/invitations-utils';

class PendingInvitationsApi extends BaseApiWithErrors {
  groups = $state<PendingInvitationGroup[]>([]);
  joinedByOrg = new SvelteSet<string>();
  joinedCoursesByOrg = $state<Record<string, JoinedCourseLink[]>>({});
  hasLoaded = $state(false);
  isModalOpen = $state(false);
  joiningOrgId = $state<string | null>(null);
  unverifiedInvite = $state<PendingTenantInvite | null>(null);
  isSendingVerification = $state(false);
  verificationSent = $state(false);
  private hasRequested = false;
  private requestedWhileVerified = false;
  private preferredOrgId: string | null = null;
  private latestFetchId = 0;

  get count() {
    return this.groups.filter((group) => !this.joinedByOrg.has(group.organization.id)).length;
  }

  /**
   * Fetches once per page load, and again when the account becomes verified, because the API
   * returns nothing for an unverified account. Call it only after the profile is known.
   */
  async fetchOnce() {
    const isEmailVerified = get(profile).isEmailVerified === true;
    const becameVerified = isEmailVerified && !this.requestedWhileVerified;

    if (this.hasRequested && !becameVerified) return;

    this.hasRequested = true;
    this.requestedWhileVerified = isEmailVerified;
    await this.fetchPendingInvitations();
  }

  /** Loads the account's invitations; a response from an older request than the latest one is ignored. */
  async fetchPendingInvitations() {
    this.latestFetchId += 1;
    const fetchId = this.latestFetchId;
    const isLatest = () => fetchId === this.latestFetchId;

    await this.execute<GetPendingInvitationsRequest>({
      requestFn: () => classroomio.account.invitations.$get(),
      logContext: 'fetching pending invitations',
      onSuccess: (response) => {
        if (isLatest()) this.groups = response.data ?? [];
      },
      onError: () => {
        if (isLatest()) this.groups = [];
      }
    });

    if (isLatest()) this.hasLoaded = true;
  }

  /**
   * Opens the modal for a tenant site the user has not joined. A verified account sees its invitations for that
   * organization first; an unverified one sees its organization invite with a prompt to verify before accepting.
   */
  async openForTenant(orgId: string, pendingInvite: PendingTenantInvite | null) {
    if (!get(profile).isEmailVerified) {
      this.unverifiedInvite = pendingInvite;
      if (pendingInvite) this.openModal(orgId);

      return;
    }

    this.unverifiedInvite = null;
    await this.fetchPendingInvitations();
    if (this.groups.some((group) => group.organization.id === orgId)) {
      this.openModal(orgId);
    }
  }

  /** Emails a verification link that returns to `returnUrl`; accepting needs a verified email. */
  async sendVerificationEmail(returnUrl: string) {
    const email = get(profile).email;
    if (!email || this.isSendingVerification) return;

    this.isSendingVerification = true;
    try {
      const callbackURL = new URL(returnUrl);
      callbackURL.searchParams.set('trigger', 'app');
      const result = await authClient.sendVerificationEmail({ email, callbackURL: callbackURL.toString() });
      if (result?.error) {
        snackbar.error('verify_email_modal.snackbar_error');
        return;
      }

      this.verificationSent = true;
    } catch (error) {
      console.error('sendVerificationEmail error:', error);
      snackbar.error('verify_email_modal.snackbar_error');
    } finally {
      this.isSendingVerification = false;
    }
  }

  openModal(preferOrgId: string | null = null) {
    this.preferredOrgId = preferOrgId;
    this.isModalOpen = true;
  }

  closeModal() {
    this.preferredOrgId = null;
    this.isModalOpen = false;
  }

  /** Clears account-scoped invitation state so the next account to sign in loads its own invitations. */
  reset() {
    this.latestFetchId += 1;
    this.groups = [];
    this.joinedByOrg.clear();
    this.joinedCoursesByOrg = {};
    this.hasLoaded = false;
    this.isModalOpen = false;
    this.joiningOrgId = null;
    this.unverifiedInvite = null;
    this.isSendingVerification = false;
    this.verificationSent = false;
    this.hasRequested = false;
    this.requestedWhileVerified = false;
    this.preferredOrgId = null;
  }

  /** Groups with the preferred org first, joined groups last. */
  get orderedGroups() {
    const preferredOrgId = this.preferredOrgId;
    const joinedByOrg = this.joinedByOrg;
    return [...this.groups].sort((a, b) => {
      if (preferredOrgId) {
        if (a.organization.id === preferredOrgId) return -1;
        if (b.organization.id === preferredOrgId) return 1;
      }
      const joinedA = joinedByOrg.has(a.organization.id) ? 1 : 0;
      const joinedB = joinedByOrg.has(b.organization.id) ? 1 : 0;
      return joinedA - joinedB;
    });
  }

  /**
   * Joins an org: accepts its org invitation, or its first emailed course
   * invitation when there is none. Binding fulfils the rest, so one accept
   * covers every pending row in the org. No reload: the card flips to a
   * success state with course links.
   */
  async joinOrg(group: PendingInvitationGroup): Promise<JoinedOrgResult | null> {
    const target = getJoinTarget(group);
    if (!target || this.joiningOrgId) return null;

    this.joiningOrgId = group.organization.id;
    const outcome: { joined: JoinedOrgResult | null } = { joined: null };

    const acceptedInviteId = target.inviteId;
    const rememberSite = () => {
      try {
        localStorage.setItem('classroomio_org_sitename', group.organization.siteName);
      } catch (error) {
        console.error('Failed to remember the organization site name:', error);
      }
    };

    if (target.kind === 'org') {
      await this.execute<AcceptOrgInviteRequest>({
        requestFn: () =>
          classroomio.invite.organization[':inviteId']['accept-by-id'].$post({ param: { inviteId: target.inviteId } }),
        logContext: 'accepting organization invite',
        onSuccess: (response) => {
          const fulfilled = response.data?.fulfilled;
          const courses = buildJoinedCourseLinks(group, acceptedInviteId, fulfilled);
          outcome.joined = { organizationId: group.organization.id, courses };
          rememberSite();
          snackbar.success('invite.invitations.messages.joined');
        },
        onError: () => {
          snackbar.error('invite.invitations.messages.join_failed');
        }
      });
    } else {
      await this.execute<(typeof classroomio.invite.student)[':inviteId']['accept-by-id']['$post']>({
        requestFn: () =>
          classroomio.invite.student[':inviteId']['accept-by-id'].$post({ param: { inviteId: target.inviteId } }),
        logContext: 'accepting course invite',
        onSuccess: (response) => {
          const fulfilled = response.data?.fulfilled;
          const trigger = group.courses.find((course: PendingInvitationCourse) => course.inviteId === target.inviteId);
          const courses = buildJoinedCourseLinks(group, acceptedInviteId, fulfilled);
          if (!courses.length && trigger) {
            courses.push({ id: trigger.courseId, title: trigger.title });
          }
          outcome.joined = { organizationId: group.organization.id, courses };
          rememberSite();
          snackbar.success('invite.invitations.messages.joined');
        },
        onError: () => {
          snackbar.error('invite.invitations.messages.join_failed');
        }
      });
    }

    this.joiningOrgId = null;

    const { joined } = outcome;
    if (joined) {
      this.joinedByOrg.add(joined.organizationId);
      this.joinedCoursesByOrg = { ...this.joinedCoursesByOrg, [joined.organizationId]: joined.courses };
    }

    return joined;
  }
}

export const pendingInvitationsApi = new PendingInvitationsApi();
