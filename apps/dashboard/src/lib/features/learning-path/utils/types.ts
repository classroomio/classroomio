import { classroomio, type InferResponseType } from '$lib/utils/services/api';

type LearningPathRoutes = (typeof classroomio)['learning-path'];
type LearningPathByIdRoutes = LearningPathRoutes[':pathId'];

export type ListLearningPathsRequest = LearningPathRoutes['$get'];
export type CreateLearningPathRequest = LearningPathRoutes['$post'];
export type GetLearningPathRequest = LearningPathByIdRoutes['$get'];
export type UpdateLearningPathRequest = LearningPathByIdRoutes['$put'];
export type DeleteLearningPathRequest = LearningPathByIdRoutes['$delete'];
export type ListLearningPathCourseOptionsRequest = LearningPathByIdRoutes['course-options']['$get'];
export type AddLearningPathCourseRequest = LearningPathByIdRoutes['courses']['$post'];
export type ReorderLearningPathCoursesRequest = LearningPathByIdRoutes['courses']['order']['$put'];
export type RemoveLearningPathCourseRequest = LearningPathByIdRoutes['courses'][':courseId']['$delete'];
export type ListLearningPathMembersRequest = LearningPathByIdRoutes['members']['$get'];
export type AddLearningPathMembersRequest = LearningPathByIdRoutes['members']['$post'];
export type RemoveLearningPathMemberRequest = LearningPathByIdRoutes['members'][':memberId']['$delete'];

type Success<T> = Extract<InferResponseType<T>, { success: true }>;

export type LearningPathList = Success<ListLearningPathsRequest>['data'];
export type LearningPathListItem = LearningPathList['paths'][number];
export type LearningPathOverview = LearningPathList['overview'];
export type LearningPathDetail = Success<GetLearningPathRequest>['data'];
export type LearningPathCourse = LearningPathDetail['courses'][number];
export type LearningPathCourseOption = Success<ListLearningPathCourseOptionsRequest>['data'][number];
export type LearningPathMember = Success<ListLearningPathMembersRequest>['data'][number];
export type AddLearningPathMembersResult = Success<AddLearningPathMembersRequest>['data'];
export type LearningPathStatus = LearningPathDetail['status'];
