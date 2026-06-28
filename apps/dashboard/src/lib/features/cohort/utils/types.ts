import { classroomio, type InferResponseType } from '$lib/utils/services/api';

type CohortListResponse = InferResponseType<typeof classroomio.cohort.$get>;
type CohortListSuccess = Extract<CohortListResponse, { success: true }>;
export type Cohort = CohortListSuccess['data'][number];

type CohortResponse = InferResponseType<(typeof classroomio.cohort)[':cohortId']['$get']>;
type CohortSuccess = Extract<CohortResponse, { success: true }>;
export type CohortDetail = CohortSuccess['data'];

type CohortMembersResponse = InferResponseType<(typeof classroomio.cohort)[':cohortId']['members']['$get']>;
type CohortMembersSuccess = Extract<CohortMembersResponse, { success: true }>;
export type CohortMember = CohortMembersSuccess['data'][number];

type CohortCoursesResponse = InferResponseType<(typeof classroomio.cohort)[':cohortId']['courses']['$get']>;
type CohortCoursesSuccess = Extract<CohortCoursesResponse, { success: true }>;
export type CohortCourse = CohortCoursesSuccess['data'][number];

export type ListCohortNewsfeedRequest = (typeof classroomio.cohort)[':cohortId']['newsfeed']['$get'];
type ListCohortNewsfeedResponse = InferResponseType<ListCohortNewsfeedRequest>;
type ListCohortNewsfeedSuccess = Extract<ListCohortNewsfeedResponse, { success: true }>;
export type CohortNewsfeed = ListCohortNewsfeedSuccess['data'];
export type ListCohortNewsfeed = CohortNewsfeed['items'];
export type CohortNewsfeedItem = ListCohortNewsfeed[number];

export type CreateCohortNewsfeedRequest = (typeof classroomio.cohort)[':cohortId']['newsfeed']['$post'];
export type UpdateCohortNewsfeedRequest = (typeof classroomio.cohort)[':cohortId']['newsfeed'][':feedId']['$put'];
export type ReactToCohortNewsfeedRequest =
  (typeof classroomio.cohort)[':cohortId']['newsfeed'][':feedId']['react']['$put'];
export type DeleteCohortNewsfeedRequest = (typeof classroomio.cohort)[':cohortId']['newsfeed'][':feedId']['$delete'];

export type GetCohortNewsfeedCommentsRequest =
  (typeof classroomio.cohort)[':cohortId']['newsfeed'][':feedId']['comments']['$get'];
type GetCohortNewsfeedCommentsResponse = InferResponseType<GetCohortNewsfeedCommentsRequest>;
type GetCohortNewsfeedCommentsSuccess = Extract<GetCohortNewsfeedCommentsResponse, { success: true }>;
export type CohortNewsfeedCommentsResponse = GetCohortNewsfeedCommentsSuccess['data'];
export type CohortNewsfeedComment = CohortNewsfeedCommentsResponse[number];

export type CreateCohortNewsfeedCommentRequest =
  (typeof classroomio.cohort)[':cohortId']['newsfeed'][':feedId']['comment']['$post'];
export type DeleteCohortNewsfeedCommentRequest =
  (typeof classroomio.cohort)[':cohortId']['newsfeed'][':feedId']['comment'][':commentId']['$delete'];

// ─── Goals ───────────────────────────────────────────────────────────────────

export type ListCohortGoalsRequest = (typeof classroomio.cohort)[':cohortId']['goals']['$get'];
type ListCohortGoalsResponse = InferResponseType<ListCohortGoalsRequest>;
type ListCohortGoalsSuccess = Extract<ListCohortGoalsResponse, { success: true }>;
export type CohortGoal = ListCohortGoalsSuccess['data'][number];
export type CohortGoalStatusCounts = CohortGoal['statusCounts'];

export type CreateCohortGoalRequest = (typeof classroomio.cohort)[':cohortId']['goals']['$post'];
export type UpdateCohortGoalRequest = (typeof classroomio.cohort)[':cohortId']['goals'][':goalId']['$put'];
export type DeleteCohortGoalRequest = (typeof classroomio.cohort)[':cohortId']['goals'][':goalId']['$delete'];

export type MyGoalsRequest = typeof classroomio.cohort.my.goals.$get;
type MyGoalsResponse = InferResponseType<MyGoalsRequest>;
type MyGoalsSuccess = Extract<MyGoalsResponse, { success: true }>;
export type MyGoalAssignment = MyGoalsSuccess['data'][number];

export type GoalsOverviewRequest = typeof classroomio.cohort.goals.overview.$get;
type GoalsOverviewResponse = InferResponseType<GoalsOverviewRequest>;
type GoalsOverviewSuccess = Extract<GoalsOverviewResponse, { success: true }>;
export type GoalsOverview = GoalsOverviewSuccess['data'];
export type GoalsOverviewRow = GoalsOverview['goals'][number];
