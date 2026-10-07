import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ClaimEarlyAdopterPlanRequest = typeof classroomio.organization.plan.claim.$post;
export type ClaimEarlyAdopterPlanSuccess = Extract<InferResponseType<ClaimEarlyAdopterPlanRequest>, { success: true }>;
export type ClaimEarlyAdopterPlanResult = ClaimEarlyAdopterPlanSuccess['data'];

export type EarlyAdopterClaimStatus = 'idle' | 'pending' | 'claimed' | 'failed';
