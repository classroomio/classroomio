import { classroomio, type InferRequestType, type InferResponseType } from '$lib/utils/services/api';
import type { TCreateLearningPath, TUpdateLearningPath } from '@cio/utils/validation/learning-path';

// RPC Request Types
export type ListLearningPathsRequest = (typeof classroomio)['learning-path']['$get'];
export type CreateLearningPathRequest = (typeof classroomio)['learning-path']['$post'];
export type GetEnrolledLearningPathsRequest = (typeof classroomio)['learning-path']['enrolled']['$get'];
export type GetLearningPathDetailRequest = (typeof classroomio)['learning-path'][':pathId']['$get'];
export type UpdateLearningPathRequest = (typeof classroomio)['learning-path'][':pathId']['$put'];
export type DeleteLearningPathRequest = (typeof classroomio)['learning-path'][':pathId']['$delete'];
export type EnrollInLearningPathRequest = (typeof classroomio)['learning-path'][':pathId']['enroll']['$post'];
export type AddPathCoursesRequest = (typeof classroomio)['learning-path'][':pathId']['courses']['$post'];
export type ReorderPathCoursesRequest = (typeof classroomio)['learning-path'][':pathId']['courses']['order']['$put'];
export type RemovePathCourseRequest =
  (typeof classroomio)['learning-path'][':pathId']['courses'][':courseId']['$delete'];
export type ListPathMembersRequest = (typeof classroomio)['learning-path'][':pathId']['members']['$get'];
export type AddPathMembersRequest = (typeof classroomio)['learning-path'][':pathId']['members']['$post'];
export type RemovePathMemberRequest =
  (typeof classroomio)['learning-path'][':pathId']['members'][':memberId']['$delete'];
export type GetPathAnalyticsRequest = (typeof classroomio)['learning-path'][':pathId']['analytics']['$get'];
export type GetPathMemberDetailRequest =
  (typeof classroomio)['learning-path'][':pathId']['members'][':personId']['$get'];
export type ListPathMembersRequestQuery = NonNullable<InferRequestType<ListPathMembersRequest>['query']>;
export type GetPathInviteLinkRequest = (typeof classroomio)['learning-path'][':pathId']['invite-link']['$get'];
export type CreatePathInviteLinkRequest = (typeof classroomio)['learning-path'][':pathId']['invite-link']['$post'];
export type TogglePathInviteLinkRequest = (typeof classroomio)['learning-path'][':pathId']['invite-link']['$patch'];

// RPC Success Response Types
export type ListLearningPathsSuccess = Extract<InferResponseType<ListLearningPathsRequest>, { success: true }>;
export type CreateLearningPathSuccess = Extract<InferResponseType<CreateLearningPathRequest>, { success: true }>;
export type GetEnrolledLearningPathsSuccess = Extract<
  InferResponseType<GetEnrolledLearningPathsRequest>,
  { success: true }
>;
export type GetLearningPathDetailSuccess = Extract<InferResponseType<GetLearningPathDetailRequest>, { success: true }>;
export type UpdateLearningPathSuccess = Extract<InferResponseType<UpdateLearningPathRequest>, { success: true }>;
export type DeleteLearningPathSuccess = Extract<InferResponseType<DeleteLearningPathRequest>, { success: true }>;
export type EnrollInLearningPathSuccess = Extract<InferResponseType<EnrollInLearningPathRequest>, { success: true }>;
export type AddPathCoursesSuccess = Extract<InferResponseType<AddPathCoursesRequest>, { success: true }>;
export type ReorderPathCoursesSuccess = Extract<InferResponseType<ReorderPathCoursesRequest>, { success: true }>;
export type RemovePathCourseSuccess = Extract<InferResponseType<RemovePathCourseRequest>, { success: true }>;
export type ListPathMembersSuccess = Extract<InferResponseType<ListPathMembersRequest>, { success: true }>;
export type AddPathMembersSuccess = Extract<InferResponseType<AddPathMembersRequest>, { success: true }>;
export type RemovePathMemberSuccess = Extract<InferResponseType<RemovePathMemberRequest>, { success: true }>;
export type GetPathAnalyticsSuccess = Extract<InferResponseType<GetPathAnalyticsRequest>, { success: true }>;
export type GetPathMemberDetailSuccess = Extract<InferResponseType<GetPathMemberDetailRequest>, { success: true }>;
export type GetPathInviteLinkSuccess = Extract<InferResponseType<GetPathInviteLinkRequest>, { success: true }>;
export type CreatePathInviteLinkSuccess = Extract<InferResponseType<CreatePathInviteLinkRequest>, { success: true }>;
export type TogglePathInviteLinkSuccess = Extract<InferResponseType<TogglePathInviteLinkRequest>, { success: true }>;

// Data Models Inferred from API
export type CreateLearningPathData = CreateLearningPathSuccess['data'];
export type UpdateLearningPathData = UpdateLearningPathSuccess['data'];
export type LearningPathSummary = ListLearningPathsSuccess['data'][number];
export type LearningPathDetail = GetLearningPathDetailSuccess['data'];
export type LearningPathCourseItem = LearningPathDetail['courses'][number];
export type EnrolledLearningPath = GetEnrolledLearningPathsSuccess['data'][number];
// Members endpoint returns a paginated shape: { data, pagination }
export type PathMembersPagination = ListPathMembersSuccess['data']['pagination'];
export type PathMembersData = ListPathMembersSuccess['data']['data'];
export type LearningPathMemberItem = PathMembersData[number];
export type LearningPathAnalytics = GetPathAnalyticsSuccess['data'];
export type PathAnalyticsSummary = LearningPathAnalytics['summary'];
export type PathAnalyticsFunnelRow = LearningPathAnalytics['funnel'][number];
export type PathAnalyticsStuckItem = LearningPathAnalytics['stuckItems'][number];
export type PathAnalyticsStudent = LearningPathAnalytics['students'][number];
export type PathMemberDetail = GetPathMemberDetailSuccess['data'];
export type PathMemberDetailCourse = PathMemberDetail['courses'][number];
export type PathInviteLink = GetPathInviteLinkSuccess['data'];

// Input Types Re-exported from Validation Schemas
export type CreateLearningPathInput = Omit<TCreateLearningPath, 'organizationId'> & { organizationId?: string };
export type UpdateLearningPathInput = TUpdateLearningPath;

// UI & Filter Types
export type StatusFilter = 'all' | 'published' | 'unpublished';
export type EnrollmentFilter = 'all' | 'none' | '1-49' | '50+';
export type CompletionFilter = 'all' | 'low' | 'medium' | 'high';
export type ViewMode = 'grid' | 'list';

/** Learner status filter for the path people table; `all` sends no status to the API. */
export type PathMemberStatusFilter = 'all' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

/** UI options for the paginated path members request. */
export type PathMembersListOptions = {
  page: number;
  limit: number;
  status?: Exclude<PathMemberStatusFilter, 'all'>;
  roleId?: number;
  search?: string;
};

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  actionText: string;
  href: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface LearningPathAccessOptions {
  isAdmin?: boolean | null;
  userProfileId?: string | null;
}
