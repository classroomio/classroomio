import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GetPendingInvitesRequest = typeof classroomio.account.invites.$get;
type GetPendingInvitesResponse = Extract<InferResponseType<GetPendingInvitesRequest>, { success: true }>;
export type PendingOrgInvites = GetPendingInvitesResponse['data'];
export type PendingOrgInviteItem = PendingOrgInvites[number];

export type AcceptOrgInviteRequest = (typeof classroomio.invite.organization)[':inviteId']['accept-by-id']['$post'];

export type GetPendingInvitationsRequest = typeof classroomio.account.invitations.$get;
type GetPendingInvitationsResponse = Extract<InferResponseType<GetPendingInvitationsRequest>, { success: true }>;
export type PendingInvitationGroups = GetPendingInvitationsResponse['data'];
export type PendingInvitationGroup = PendingInvitationGroups[number];
export type PendingInvitationCourse = PendingInvitationGroup['courses'][number];
export type PendingInvitationCohort = PendingInvitationGroup['cohorts'][number];

export type GetPendingTenantInviteRequest = typeof classroomio.invite.organization.pending.$get;
type GetPendingTenantInviteResponse = Extract<InferResponseType<GetPendingTenantInviteRequest>, { success: true }>;
export type PendingTenantInvite = NonNullable<GetPendingTenantInviteResponse['data']>;

export type JoinedCourseLink = {
  id: string;
  title: string | null;
};

export type JoinedOrgResult = {
  organizationId: string;
  courses: JoinedCourseLink[];
};
