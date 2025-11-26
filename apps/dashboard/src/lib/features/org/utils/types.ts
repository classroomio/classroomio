import { classroomio, type InferResponseType } from '$lib/utils/services/api';

// Team member types
export type GetTeamResponse = (typeof classroomio.organization)[':orgId']['team']['$get'];
export type OrganizationTeamResponse = InferResponseType<GetTeamResponse> | null;
export type OrganizationTeamSuccess = Extract<InferResponseType<GetTeamResponse>, { success: true }>;

export type OrganizationTeamMembers = OrganizationTeamSuccess['data'];

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
