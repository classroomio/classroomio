import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type UpdateOrganizationRequestType = (typeof classroomio.organization)[':orgId']['$put'];
export type UpdateOrganizationResponse = InferResponseType<UpdateOrganizationRequestType>;
export type UpdateOrganizationSuccess = Extract<UpdateOrganizationResponse, { success: true }>;
