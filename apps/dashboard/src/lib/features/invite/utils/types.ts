import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GetPendingOrgInvitesRequest = (typeof classroomio.invite.organization)['pending-all']['$get'];
type GetPendingOrgInvitesResponse = Extract<InferResponseType<GetPendingOrgInvitesRequest>, { success: true }>;
export type PendingOrgInvites = GetPendingOrgInvitesResponse['data'];
export type PendingOrgInviteItem = PendingOrgInvites[number];

export type AcceptOrgInviteRequest = (typeof classroomio.invite.organization)[':inviteId']['accept-by-id']['$post'];
