import type { InferRequestType, InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type Success<Response> = Extract<Response, { success: true }>;

type Account = ApiClient['account'];
type Insights = ApiClient['organization']['insights'];
type CourseRoute = ApiClient['course'][':courseId'];

export type TeachingStats = Success<InferResponseType<Account['teaching-stats']['$get'], 200>>['data'];

export type TeachingSession = Success<InferResponseType<Account['teaching-sessions']['$get'], 200>>['data'][number];

type TeachingActivityPage = Success<InferResponseType<Account['teaching-activity']['$get'], 200>>['data'];
export type TeachingActivity = TeachingActivityPage['items'][number];
export type TeachingActivityKind = TeachingActivity['kind'];

export type UpcomingSubmission = Success<
  InferResponseType<Account['teaching-submissions']['upcoming']['$get'], 200>
>['data'][number];

type SubmissionHistoryPage = Success<
  InferResponseType<Account['teaching-submissions']['history']['$get'], 200>
>['data'];
export type GradedSubmission = SubmissionHistoryPage['items'][number];

type TeachingLearnersPage = Success<InferResponseType<Account['teaching-learners']['$get'], 200>>['data'];
export type TeachingLearner = TeachingLearnersPage['items'][number];
export type LearnerFilter = NonNullable<InferRequestType<Account['teaching-learners']['$get']>['query']['filter']>;

export type NudgeResult = Success<InferResponseType<Account['teaching-learners']['nudge']['$post'], 200>>['data'];

export type OrgHealth = Success<InferResponseType<Insights['health']['$get'], 200>>['data'];
export type DraftCourse = OrgHealth['draftCourses'][number];

type OrgPeoplePage = Success<InferResponseType<Insights['people']['$get'], 200>>['data'];
export type OrgPerson = OrgPeoplePage['items'][number];
export type PeopleRoleFilter = NonNullable<InferRequestType<Insights['people']['$get']>['query']['role']>;

export type StudentCapacity = Success<InferResponseType<Insights['student-capacity']['$get'], 200>>['data'];

type CourseMembersResponse = Success<InferResponseType<CourseRoute['members']['$get'], 200>>;
export type CourseMember = CourseMembersResponse['data'][number];

export type InvitePreset = NonNullable<InferRequestType<CourseRoute['invites']['$post']>['json']['preset']>;

export type CourseInviteLink = Success<InferResponseType<CourseRoute['invites']['link']['$post'], 200>>['data'];

export type CourseUpdateInput = InferRequestType<CourseRoute['$put']>['json'];
