import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GetOrgNavCountsRequest = (typeof classroomio.organization)['nav-counts']['$get'];
export type GetOrgNavCountsSuccess = Extract<InferResponseType<GetOrgNavCountsRequest>, { success: true }>;
export type OrgNavCounts = GetOrgNavCountsSuccess['data'];
export type OrgNavCountKey = keyof OrgNavCounts;
