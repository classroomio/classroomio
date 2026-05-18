import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type LandingStatsRequest = (typeof classroomio.dash)['landing-stats']['$get'];
export type CountryBreakdownRequest = (typeof classroomio.dash)['country-breakdown']['$get'];
export type CourseFunnelRequest = (typeof classroomio.dash)['course-funnel']['$get'];
export type PopularTypesRequest = (typeof classroomio.dash)['popular-types']['$get'];

export type LandingStatsSuccess = Extract<InferResponseType<LandingStatsRequest>, { success: true }>;
export type CountryBreakdownSuccess = Extract<InferResponseType<CountryBreakdownRequest>, { success: true }>;
export type CourseFunnelSuccess = Extract<InferResponseType<CourseFunnelRequest>, { success: true }>;
export type PopularTypesSuccess = Extract<InferResponseType<PopularTypesRequest>, { success: true }>;

export type LandingStatsData = LandingStatsSuccess['data'];
export type CountryBreakdownData = CountryBreakdownSuccess['data'];
export type CourseFunnelData = CourseFunnelSuccess['data'];
export type PopularTypesData = PopularTypesSuccess['data'];

export type AnalyticsRange = 7 | 30 | 90;
