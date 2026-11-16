import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GetOrgMathNotationRequest = (typeof classroomio.organization)['math-notation']['$get'];
export type UpdateOrgMathNotationRequest = (typeof classroomio.organization)['math-notation']['$put'];

export type GetCourseMathNotationRequest = (typeof classroomio.course)[':courseId']['math-notation']['$get'];
export type UpdateCourseMathNotationRequest = (typeof classroomio.course)[':courseId']['math-notation']['$put'];

export type GetOrgMathNotationSuccess = Extract<InferResponseType<GetOrgMathNotationRequest>, { success: true }>;
export type OrgMathNotation = GetOrgMathNotationSuccess['data'];

export type GetCourseMathNotationSuccess = Extract<InferResponseType<GetCourseMathNotationRequest>, { success: true }>;
export type CourseMathNotationView = GetCourseMathNotationSuccess['data'];
