import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GetPendingInvitesRequest = typeof classroomio.account.invites.$get;
type GetPendingInvitesResponse = Extract<InferResponseType<GetPendingInvitesRequest>, { success: true }>;
export type PendingOrgInvites = GetPendingInvitesResponse['data'];
export type PendingOrgInviteItem = PendingOrgInvites[number];

export type AcceptOrgInviteRequest = (typeof classroomio.invite.organization)[':inviteId']['accept-by-id']['$post'];

/**
 * Minimum an invite needs for the accept modal. Structural on purpose: both the
 * account-scoped notification list and the org-scoped tenant-site flow satisfy it.
 */
export type AcceptableOrgInvite = {
  id: string;
  email: string | null;
  roleId: number;
  roleLabel: string;
  organization: { name: string; siteName: string };
};
