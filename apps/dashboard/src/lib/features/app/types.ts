import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type AccountResponse = InferResponseType<typeof classroomio.account.$get> | null;

export type AccountSuccess = Extract<InferResponseType<typeof classroomio.account.$get>, { success: true }>;

export type AccountOrg = AccountSuccess['organizations'][number];
