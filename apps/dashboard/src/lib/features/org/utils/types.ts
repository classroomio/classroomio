import { classroomio, type InferResponseType } from '$lib/utils/services/api';

// Team member types
export type GetTeamResponse = (typeof classroomio.organization)[':orgId']['team']['$get'];
export type OrganizationTeamResponse = InferResponseType<GetTeamResponse> | null;
export type OrganizationTeamSuccess = Extract<InferResponseType<GetTeamResponse>, { success: true }>;

export type OrganizationTeamMembersRaw = OrganizationTeamSuccess['data'];

// Mapped team members with role and isAdmin (mapped in API layer)
export type OrganizationTeamMembers = Array<
  OrganizationTeamMembersRaw[number] & {
    role: string;
    isAdmin: boolean;
    verified: boolean;
  }
>;

// Audience types
export type GetAudienceResponse = (typeof classroomio.organization)[':orgId']['audience']['$get'];
export type OrganizationAudienceResponse = InferResponseType<GetAudienceResponse> | null;
export type OrganizationAudienceSuccess = Extract<InferResponseType<GetAudienceResponse>, { success: true }>;

export type OrganizationAudience = OrganizationAudienceSuccess['data'];

// Org Public Courses  types
export type GetCoursesBySiteNameResponse = typeof classroomio.organization.courses.$get;
export type CoursesByOrganizationSiteNameResponse = InferResponseType<GetCoursesBySiteNameResponse> | null;
export type CoursesByOrganizationSiteNameSuccess = Extract<
  InferResponseType<GetCoursesBySiteNameResponse>,
  { success: true }
>;

export type CoursesByOrganizationSiteName = CoursesByOrganizationSiteNameSuccess['data'];

// dashboard analytics types
export type GetDashStatsResponse = typeof classroomio.dash.stats.$get;
export type DashStatsResponse = InferResponseType<GetDashStatsResponse> | null;
export type DashStatsSuccess = Extract<InferResponseType<GetDashStatsResponse>, { success: true }>;

export type InviteTeamResponse = (typeof classroomio.organization)[':orgId']['team']['invite']['$post'];
export type InviteTeamSuccess = Extract<InferResponseType<InviteTeamResponse>, { success: true }>;
export type InviteTeamData = InviteTeamSuccess['data'];

export type DeleteTeamResponse = (typeof classroomio.organization)[':orgId']['team'][':memberId']['$delete'];
export type DeleteTeamSuccess = Extract<InferResponseType<DeleteTeamResponse>, { success: true }>;
