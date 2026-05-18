import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GenerateTextRequest = (typeof classroomio.agent)['generate-text']['$post'];
export type GenerateTextSuccess = Extract<InferResponseType<GenerateTextRequest>, { success: true }>;
