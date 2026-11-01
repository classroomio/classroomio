import type { InferRequestType, InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type Success<Response> = Extract<Response, { success: true }>;

type TeachingCoursesResponse = Success<InferResponseType<ApiClient['account']['teaching-courses']['$get'], 200>>;
export type TeachingCourse = TeachingCoursesResponse['data'][number];

type GradingQueueResponse = Success<InferResponseType<ApiClient['account']['grading-queue']['$get'], 200>>;
export type GradingQueueItem = GradingQueueResponse['data'][number];

type GradingSubmissionResponse = Success<
  InferResponseType<ApiClient['account']['grading-queue'][':submissionId']['$get'], 200>
>;
export type GradingSubmission = GradingSubmissionResponse['data'];
export type GradingQuestion = GradingSubmission['questions'][number];
export type GradingAnswer = NonNullable<GradingQuestion['answer']>;
export type GradingAnswerOf<Type extends GradingAnswer['type']> = Extract<GradingAnswer, { type: Type }>;
export type QuestionTypeKey = GradingQuestion['type'];
export type GradingState = GradingSubmission['gradingState'];

type CourseSubmissionRoute = ApiClient['course'][':courseId']['submission'][':submissionId'];
export type SaveGradesInput = InferRequestType<CourseSubmissionRoute['grades']['$put']>['json'];

type TeachCourseResponse = Success<InferResponseType<ApiClient['course'][':courseId']['$get'], 200>>;
export type TeachCourse = TeachCourseResponse['data'];
export type TeachCourseMember = NonNullable<TeachCourse['group']>['members'][number];
export type TeachCourseAttendance = TeachCourse['attendance'][number];

type CourseAnalyticsResponse = Success<InferResponseType<ApiClient['course'][':courseId']['analytics']['$get'], 200>>;
export type CourseAnalytics = CourseAnalyticsResponse['data'];
export type CourseAnalyticsLearner = CourseAnalytics['students'][number];

type NewsfeedRoute = ApiClient['course'][':courseId']['newsfeed'];
type NewsfeedListResponse = Success<InferResponseType<NewsfeedRoute['$get'], 200>>;
export type NewsfeedPage = NewsfeedListResponse['data'];
export type NewsfeedPost = NewsfeedPage['items'][number];

type NewsfeedCommentsResponse = Success<InferResponseType<NewsfeedRoute[':feedId']['comments']['$get'], 200>>;
export type NewsfeedCommentThread = NewsfeedCommentsResponse['data'];

export type AttendanceStatus = 'present' | 'absent';
