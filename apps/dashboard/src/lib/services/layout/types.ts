import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type AccountResponse = InferResponseType<typeof classroomio.account.$get> | null;

export type AccountSuccess = InferResponseType<typeof classroomio.account.$get, 200>;

export type AccountOrg = AccountSuccess['organizations'][number];
