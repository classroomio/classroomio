import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type LatestCourseBuildRequest = (typeof classroomio.organization)['course-build']['latest']['$get'];
export type LatestCourseBuildSuccess = Extract<InferResponseType<LatestCourseBuildRequest>, { success: true }>;
export type CourseBuildSummary = NonNullable<LatestCourseBuildSuccess['data']>;
export type CourseBuildSource = CourseBuildSummary['sources'][number];
export type CourseBuildCourse = CourseBuildSummary['courses'][number];
