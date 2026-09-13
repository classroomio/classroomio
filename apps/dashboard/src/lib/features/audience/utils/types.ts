import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GetAudienceAnalyticsRequest = (typeof classroomio.organization.audience)[':userId']['analytics']['$get'];
export type GetAudienceAnalyticsSuccess = Extract<InferResponseType<GetAudienceAnalyticsRequest>, { success: true }>;
export type AudienceAnalytics = GetAudienceAnalyticsSuccess['data'];
export type AudienceAnalyticsCourse = AudienceAnalytics['courses'][number];
export type AudienceAnalyticsExercise = AudienceAnalyticsCourse['exercises'][number];
export type AudienceAnalyticsUser = AudienceAnalytics['user'];
