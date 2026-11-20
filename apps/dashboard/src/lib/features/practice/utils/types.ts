import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type CreatePracticeRequest = (typeof classroomio.course)[':courseId']['practice']['$post'];
export type CreatePracticeSuccess = Extract<InferResponseType<CreatePracticeRequest>, { success: true }>;
export type CreatedPractice = CreatePracticeSuccess['data'];

export type PracticeStudent = { profileId: string; name: string };

export type PracticeSource = { skillId: string } | { sourceQuestionIds: number[] };
