import { classroomio, type InferResponseType } from '$lib/utils/services/api';

// List lessons types
export type ListLessonsRequest = (typeof classroomio.course)[':courseId']['lesson']['$get'];
export type ListLessonsResponse = InferResponseType<ListLessonsRequest> | null;
export type ListLessonsSuccess = Extract<InferResponseType<ListLessonsRequest>, { success: true }>;
export type ListLessons = ListLessonsSuccess['data'];

// Get lesson types
export type GetLessonRequest = (typeof classroomio.course)[':courseId']['lesson'][':lessonId']['$get'];
export type GetLessonResponse = InferResponseType<GetLessonRequest> | null;
export type GetLessonSuccess = Extract<InferResponseType<GetLessonRequest>, { success: true }>;
export type Lesson = GetLessonSuccess['data'];

// Create lesson types
export type CreateLessonRequest = (typeof classroomio.course)[':courseId']['lesson']['$post'];
export type CreateLessonResponse = InferResponseType<CreateLessonRequest>;
export type CreateLessonSuccess = Extract<CreateLessonResponse, { success: true }>;
export type CreateLessonData = CreateLessonSuccess['data'];

// Update lesson types
export type UpdateLessonRequest = (typeof classroomio.course)[':courseId']['lesson'][':lessonId']['$put'];
export type UpdateLessonResponse = InferResponseType<UpdateLessonRequest>;
export type UpdateLessonSuccess = Extract<UpdateLessonResponse, { success: true }>;
export type UpdateLessonData = UpdateLessonSuccess['data'];

// Delete lesson types
export type DeleteLessonRequest = (typeof classroomio.course)[':courseId']['lesson'][':lessonId']['$delete'];
export type DeleteLessonResponse = InferResponseType<DeleteLessonRequest>;
export type DeleteLessonSuccess = Extract<DeleteLessonResponse, { success: true }>;
export type DeleteLessonData = DeleteLessonSuccess['data'];

// Create lesson section types
export type CreateLessonSectionRequest = (typeof classroomio.course)[':courseId']['lesson']['section']['$post'];
export type CreateLessonSectionResponse = InferResponseType<CreateLessonSectionRequest>;
export type CreateLessonSectionSuccess = Extract<CreateLessonSectionResponse, { success: true }>;
export type CreateLessonSectionData = CreateLessonSectionSuccess['data'];

// Update lesson section types
export type UpdateLessonSectionRequest =
  (typeof classroomio.course)[':courseId']['lesson']['section'][':sectionId']['$put'];
export type UpdateLessonSectionResponse = InferResponseType<UpdateLessonSectionRequest>;
export type UpdateLessonSectionSuccess = Extract<UpdateLessonSectionResponse, { success: true }>;
export type UpdateLessonSectionData = UpdateLessonSectionSuccess['data'];

// Delete lesson section types
export type DeleteLessonSectionRequest =
  (typeof classroomio.course)[':courseId']['lesson']['section'][':sectionId']['$delete'];
export type DeleteLessonSectionResponse = InferResponseType<DeleteLessonSectionRequest>;
export type DeleteLessonSectionSuccess = Extract<DeleteLessonSectionResponse, { success: true }>;
export type DeleteLessonSectionData = DeleteLessonSectionSuccess['data'];

// Reorder lesson sections types
export type ReorderLessonSectionsRequest =
  (typeof classroomio.course)[':courseId']['lesson']['section']['reorder']['$post'];
export type ReorderLessonSectionsResponse = InferResponseType<ReorderLessonSectionsRequest>;
export type ReorderLessonSectionsSuccess = Extract<ReorderLessonSectionsResponse, { success: true }>;
export type ReorderLessonSectionsData = ReorderLessonSectionsSuccess['data'];

// Reorder lessons types
export type ReorderLessonsRequest = (typeof classroomio.course)[':courseId']['lesson']['reorder']['$post'];
export type ReorderLessonsResponse = InferResponseType<ReorderLessonsRequest>;
export type ReorderLessonsSuccess = Extract<ReorderLessonsResponse, { success: true }>;
export type ReorderLessonsData = ReorderLessonsSuccess['data'];

// Lesson Section type (derived from Course API response which includes lesson_section array)
// Since sections are returned as part of Course, we can use CreateLessonSectionData or UpdateLessonSectionData
// But for consistency, we'll use the create response as the base type
export type LessonSection = CreateLessonSectionData;

// Lesson Section with lessons (used when sections are populated with their lessons)
export interface LessonSectionWithLessons extends LessonSection {
  lessons: Course['lessons'];
}

// Get lesson comments types
export type GetLessonCommentsRequest =
  (typeof classroomio.course)[':courseId']['lesson'][':lessonId']['comment']['$get'];
export type GetLessonCommentsResponse = InferResponseType<GetLessonCommentsRequest> | null;
export type GetLessonCommentsSuccess = Extract<InferResponseType<GetLessonCommentsRequest>, { success: true }>;
export type LessonCommentsData = GetLessonCommentsSuccess['data'];
export type LessonComments = LessonCommentsData['items'];

// Create lesson comment types
export type CreateLessonCommentRequest =
  (typeof classroomio.course)[':courseId']['lesson'][':lessonId']['comment']['$post'];
export type CreateLessonCommentResponse = InferResponseType<CreateLessonCommentRequest>;
export type CreateLessonCommentSuccess = Extract<CreateLessonCommentResponse, { success: true }>;
export type CreateLessonComment = CreateLessonCommentSuccess['data'];

// Delete lesson comment types
export type DeleteLessonCommentRequest =
  (typeof classroomio.course)[':courseId']['lesson']['comment'][':commentId']['$delete'];
export type DeleteLessonCommentResponse = InferResponseType<DeleteLessonCommentRequest>;
export type DeleteLessonCommentSuccess = Extract<DeleteLessonCommentResponse, { success: true }>;
export type DeleteLessonCommentData = DeleteLessonCommentSuccess['data'];

// Update lesson comment types
export type UpdateLessonCommentRequest =
  (typeof classroomio.course)[':courseId']['lesson']['comment'][':commentId']['$put'];
export type UpdateLessonCommentResponse = InferResponseType<UpdateLessonCommentRequest>;
export type UpdateLessonCommentSuccess = Extract<UpdateLessonCommentResponse, { success: true }>;
export type UpdateLessonCommentData = UpdateLessonCommentSuccess['data'];

// Payment request types
export type CreatePaymentRequestRequest = (typeof classroomio.course)[':courseId']['payment-request']['$post'];
export type CreatePaymentRequestResponse = InferResponseType<CreatePaymentRequestRequest>;
export type CreatePaymentRequestSuccess = Extract<CreatePaymentRequestResponse, { success: true }>;
export type PaymentRequestData = CreatePaymentRequestSuccess['data'];

// Get lesson completion types
export type GetLessonCompletionRequest =
  (typeof classroomio.course)[':courseId']['lesson'][':lessonId']['completion']['$get'];
export type GetLessonCompletionResponse = InferResponseType<GetLessonCompletionRequest> | null;
export type GetLessonCompletionSuccess = Extract<InferResponseType<GetLessonCompletionRequest>, { success: true }>;
export type LessonCompletion = GetLessonCompletionSuccess['data'];

// Update lesson completion types
export type UpdateLessonCompletionRequest =
  (typeof classroomio.course)[':courseId']['lesson'][':lessonId']['completion']['$put'];
export type UpdateLessonCompletionResponse = InferResponseType<UpdateLessonCompletionRequest>;
export type UpdateLessonCompletionSuccess = Extract<UpdateLessonCompletionResponse, { success: true }>;
export type UpdateLessonCompletionData = UpdateLessonCompletionSuccess['data'];

// Get lesson history types
export type GetLessonHistoryRequest =
  (typeof classroomio.course)[':courseId']['lesson'][':lessonId']['history']['$get'];
export type GetLessonHistoryResponse = InferResponseType<GetLessonHistoryRequest> | null;
export type GetLessonHistorySuccess = Extract<InferResponseType<GetLessonHistoryRequest>, { success: true }>;
export type LessonHistory = GetLessonHistorySuccess['data'];

// Exercise types
export type ListExercisesRequest = (typeof classroomio.course)[':courseId']['exercise']['$get'];
export type ListExercisesResponse = InferResponseType<ListExercisesRequest> | null;
export type ListExercisesSuccess = Extract<InferResponseType<ListExercisesRequest>, { success: true }>;
export type Exercises = ListExercisesSuccess['data'];

export type GetExerciseRequest = (typeof classroomio.course)[':courseId']['exercise'][':exerciseId']['$get'];
export type GetExerciseResponse = InferResponseType<GetExerciseRequest> | null;
export type GetExerciseSuccess = Extract<InferResponseType<GetExerciseRequest>, { success: true }>;
export type Exercise = GetExerciseSuccess['data'];

export type CreateExerciseRequest = (typeof classroomio.course)[':courseId']['exercise']['$post'];
export type CreateExerciseFromTemplateRequest =
  (typeof classroomio.course)[':courseId']['exercise']['from-template']['$post'];
export type CreateExerciseFromTemplateResponse = InferResponseType<CreateExerciseFromTemplateRequest>;
export type CreateExerciseFromTemplateSuccess = Extract<CreateExerciseFromTemplateResponse, { success: true }>;
export type CreateExerciseFromTemplateData = CreateExerciseFromTemplateSuccess['data'];

export type UpdateExerciseRequest = (typeof classroomio.course)[':courseId']['exercise'][':exerciseId']['$put'];
export type DeleteExerciseRequest = (typeof classroomio.course)[':courseId']['exercise'][':exerciseId']['$delete'];
export type SubmitExerciseRequest =
  (typeof classroomio.course)[':courseId']['exercise'][':exerciseId']['submission']['$post'];
// Note: check-completion route does not exist in the API

// Newsfeed types
export type ListNewsfeedRequest = (typeof classroomio.course)[':courseId']['newsfeed']['$get'];
export type ListNewsfeedResponse = InferResponseType<ListNewsfeedRequest> | null;
export type ListNewsfeedSuccess = Extract<InferResponseType<ListNewsfeedRequest>, { success: true }>;
export type ListNewsfeedPaginated = ListNewsfeedSuccess['data'];
export type ListNewsfeed = ListNewsfeedPaginated['items'];

export type GetNewsfeedRequest = (typeof classroomio.course)[':courseId']['newsfeed'][':feedId']['$get'];
export type CreateNewsfeedRequest = (typeof classroomio.course)[':courseId']['newsfeed']['$post'];
export type UpdateNewsfeedRequest = (typeof classroomio.course)[':courseId']['newsfeed'][':feedId']['$put'];

export type ReactToNewsfeedRequest = (typeof classroomio.course)[':courseId']['newsfeed'][':feedId']['react']['$put'];
export type ReactToNewsfeedResponse = InferResponseType<ReactToNewsfeedRequest>;
export type ReactToNewsfeedSuccess = Extract<ReactToNewsfeedResponse, { success: true }>;
export type ReactToNewsfeed = ReactToNewsfeedSuccess['data'];

export type DeleteNewsfeedRequest = (typeof classroomio.course)[':courseId']['newsfeed'][':feedId']['$delete'];
export type GetNewsfeedCommentsRequest =
  (typeof classroomio.course)[':courseId']['newsfeed'][':feedId']['comments']['$get'];
export type GetNewsfeedCommentsResponse = InferResponseType<GetNewsfeedCommentsRequest> | null;
export type GetNewsfeedCommentsSuccess = Extract<InferResponseType<GetNewsfeedCommentsRequest>, { success: true }>;
export type NewsfeedCommentsResponse = GetNewsfeedCommentsSuccess['data'];

export type CreateNewsfeedCommentRequest =
  (typeof classroomio.course)[':courseId']['newsfeed'][':feedId']['comment']['$post'];
export type UpdateNewsfeedCommentRequest =
  (typeof classroomio.course)[':courseId']['newsfeed']['comment'][':commentId']['$put'];
export type DeleteNewsfeedCommentRequest =
  (typeof classroomio.course)[':courseId']['newsfeed']['comment'][':commentId']['$delete'];

// Get single newsfeed response types (includes full structure with author)
export type GetNewsfeedResponse = InferResponseType<GetNewsfeedRequest> | null;
export type GetNewsfeedSuccess = Extract<InferResponseType<GetNewsfeedRequest>, { success: true }>;
export type GetNewsfeedData = GetNewsfeedSuccess['data'];

// Extract feed types from API responses
export type Feed = ListNewsfeed[number];

export type NewsfeedComment = NewsfeedCommentsResponse['items'][number];
export type Reaction = NonNullable<Feed['reaction']>;

// Attendance types
// Note: Only POST (upsert) route exists, no GET or PUT routes
export type UpsertAttendanceRequest = (typeof classroomio.course)[':courseId']['attendance']['$post'];

// Mark types
export type GetMarksRequest = (typeof classroomio.course)[':courseId']['mark']['$get'];
export type GetMarksResponse = InferResponseType<GetMarksRequest> | null;
export type GetMarksSuccess = Extract<InferResponseType<GetMarksRequest>, { success: true }>;
export type Marks = GetMarksSuccess['data'];

// Submission types
export type ListSubmissionsRequest = (typeof classroomio.course)[':courseId']['submission']['$get'];
export type ListSubmissionsResponse = InferResponseType<ListSubmissionsRequest> | null;
export type ListSubmissionsSuccess = Extract<InferResponseType<ListSubmissionsRequest>, { success: true }>;
export type Submissions = ListSubmissionsSuccess['data'];

// List submissions for grading types
export type ListSubmissionsForGradingRequest =
  (typeof classroomio.course)[':courseId']['submission']['for-grading']['$get'];
export type ListSubmissionsForGradingResponse = InferResponseType<ListSubmissionsForGradingRequest> | null;
export type ListSubmissionsForGradingSuccess = Extract<
  InferResponseType<ListSubmissionsForGradingRequest>,
  { success: true }
>;
export type SubmissionsForGradingData = ListSubmissionsForGradingSuccess['data'];

// Extract types from SubmissionsForGradingData
export type SubmissionSection = SubmissionsForGradingData['sections'][number];
export type SubmissionItem = SubmissionSection['items'][number];
export type SubmissionIdData = SubmissionsForGradingData['submissionIdData'][string];

export type UpdateSubmissionRequest = (typeof classroomio.course)[':courseId']['submission'][':submissionId']['$put'];
export type DeleteSubmissionRequest =
  (typeof classroomio.course)[':courseId']['submission'][':submissionId']['$delete'];
export type UpdateSubmissionAnswerRequest =
  (typeof classroomio.course)[':courseId']['submission'][':submissionId']['answer']['$put'];

// Course types
export type CreateCourseRequest = typeof classroomio.course.$post;
export type GetCourseRequest = (typeof classroomio.course)[':courseId']['$get'];
export type GetCourseBySlugRequest = (typeof classroomio.course)['slug'][':slug']['$get'];
export type UpdateCourseRequest = (typeof classroomio.course)[':courseId']['$put'];
export type DeleteCourseRequest = (typeof classroomio.course)[':courseId']['$delete'];
export type GetCourseProgressRequest = (typeof classroomio.course)[':courseId']['progress']['$get'];
export type CloneCourseRequest = (typeof classroomio.course)[':courseId']['clone']['$post'];

// Course response types
export type GetCourseResponse = InferResponseType<GetCourseRequest> | null;
export type GetCourseSuccess = Extract<InferResponseType<GetCourseRequest>, { success: true }>;
export type Course = GetCourseSuccess['data'];

export type UpdateCourseResponse = InferResponseType<UpdateCourseRequest>;
export type UpdateCourseSuccess = Extract<UpdateCourseResponse, { success: true }>;
export type UpdateCourseData = UpdateCourseSuccess['data'];

export type DeleteCourseResponse = InferResponseType<DeleteCourseRequest>;
export type DeleteCourseSuccess = Extract<DeleteCourseResponse, { success: true }>;
export type DeleteCourseData = DeleteCourseSuccess['data'];

export type GetCourseProgressResponse = InferResponseType<GetCourseProgressRequest> | null;
export type GetCourseProgressSuccess = Extract<InferResponseType<GetCourseProgressRequest>, { success: true }>;
export type CourseProgress = GetCourseProgressSuccess['data'];

// Course Members types
export type ListPeopleRequest = (typeof classroomio.course)[':courseId']['members']['$get'];
export type ListPeopleResponse = InferResponseType<ListPeopleRequest> | null;
export type ListPeopleSuccess = Extract<InferResponseType<ListPeopleRequest>, { success: true }>;
export type CourseMembers = ListPeopleSuccess['data'];
export type CourseMember = CourseMembers[number];

export type AddPeopleRequest = (typeof classroomio.course)[':courseId']['members']['$post'];
export type AddPeopleResponse = InferResponseType<AddPeopleRequest>;
export type AddPeopleSuccess = Extract<AddPeopleResponse, { success: true }>;
export type AddPeopleData = AddPeopleSuccess['data'];

export type UpdatePeopleRequest = (typeof classroomio.course)[':courseId']['members'][':memberId']['$put'];
export type UpdatePeopleResponse = InferResponseType<UpdatePeopleRequest>;
export type UpdatePeopleSuccess = Extract<UpdatePeopleResponse, { success: true }>;
export type UpdatePeopleData = UpdatePeopleSuccess['data'];

export type DeletePeopleRequest = (typeof classroomio.course)[':courseId']['members'][':memberId']['$delete'];
export type DeletePeopleResponse = InferResponseType<DeletePeopleRequest>;
export type DeletePeopleSuccess = Extract<DeletePeopleResponse, { success: true }>;
export type DeletePeopleData = DeletePeopleSuccess['data'];

export type GetUserCourseAnalyticsRequest =
  (typeof classroomio.course)[':courseId']['members'][':userId']['analytics']['$get'];
export type GetUserCourseAnalyticsResponse = InferResponseType<GetUserCourseAnalyticsRequest>;
export type GetUserCourseAnalyticsSuccess = Extract<GetUserCourseAnalyticsResponse, { success: true }>;
export type UserCourseAnalytics = GetUserCourseAnalyticsSuccess['data'];

export type GetCourseAnalyticsRequest = (typeof classroomio.course)[':courseId']['analytics']['$get'];
export type GetCourseAnalyticsResponse = InferResponseType<GetCourseAnalyticsRequest>;
export type GetCourseAnalyticsSuccess = Extract<GetCourseAnalyticsResponse, { success: true }>;
export type CourseAnalytics = GetCourseAnalyticsSuccess['data'];

// Derived types from Lesson
export type LessonVideoType = NonNullable<Lesson['videos']>[number]['type'];
export type LessonDocument = NonNullable<Lesson['documents']>[number];

// Derived types from Course metadata
export type Tabs = NonNullable<NonNullable<Course['metadata']>['lessonTabsOrder']>[number];
export type Review = NonNullable<NonNullable<Course['metadata']>['reviews']>[number];

export interface ExerciseSubmissions {
  id: string;
  status_id: number;
  submitted_by: {
    profile: {
      id: string;
      fullname: string;
      avatar_url: string;
    };
  };
  answers: {
    answers: string[];
    group_member_id: string;
    id: number;
    open_answer: string;
    point: number;
    question_id: number;
    submission_id: string;
  }[];
}

// Exercise template types
export type GetAllTemplatesMetadataRequest = (typeof classroomio.course)[':courseId']['exercise']['template']['$get'];
export type GetAllTemplatesMetadataSuccess = Extract<
  InferResponseType<GetAllTemplatesMetadataRequest>,
  { success: true }
>;
export type GetAllTemplatesMetadataData = GetAllTemplatesMetadataSuccess['data'];

export type GetTemplateByTagRequest =
  (typeof classroomio.course)[':courseId']['exercise']['template']['tag'][':tag']['$get'];
export type GetTemplateByTagSuccess = Extract<InferResponseType<GetTemplateByTagRequest>, { success: true }>;
export type GetTemplateByTagData = GetTemplateByTagSuccess['data'];

export type GetTemplateByIdRequest = (typeof classroomio.course)[':courseId']['exercise']['template'][':id']['$get'];
export type GetTemplateByIdSuccess = Extract<InferResponseType<GetTemplateByIdRequest>, { success: true }>;
export type GetTemplateByIdData = GetTemplateByIdSuccess['data'];
