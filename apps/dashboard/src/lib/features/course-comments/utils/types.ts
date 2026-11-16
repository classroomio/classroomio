import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import type { TCourseCommentAnchorInput } from '@cio/utils/validation/course-comment';

type CourseComments = (typeof classroomio.course)[':courseId']['comments'];

export type ListCourseCommentsRequest = CourseComments['$get'];
export type GetCourseCommentSummaryRequest = CourseComments['summary']['$get'];
export type GetCourseCommentTeamRequest = CourseComments['team']['$get'];
export type CreateCourseCommentThreadRequest = CourseComments['$post'];
export type GetCourseCommentThreadRequest = CourseComments[':threadId']['$get'];
export type ReplyCourseCommentRequest = CourseComments[':threadId']['comments']['$post'];
export type EditCourseCommentRequest = CourseComments[':threadId']['comments'][':commentId']['$patch'];
export type DeleteCourseCommentRequest = CourseComments[':threadId']['comments'][':commentId']['$delete'];
export type ResolveCourseCommentThreadRequest = CourseComments[':threadId']['resolve']['$post'];
export type ReopenCourseCommentThreadRequest = CourseComments[':threadId']['reopen']['$post'];
export type MarkCourseCommentThreadReadRequest = CourseComments[':threadId']['read']['$post'];
export type MarkAllCourseCommentsReadRequest = CourseComments['read-all']['$post'];

type ListCourseCommentsSuccess = Extract<InferResponseType<ListCourseCommentsRequest>, { success: true }>;
export type CourseCommentThread = ListCourseCommentsSuccess['data'][number];
export type CourseComment = CourseCommentThread['comments'][number];
export type CourseCommentPerson = CourseComment['author'];
export type CourseCommentAnchorType = CourseCommentThread['anchorType'];
export type CourseCommentAnchorState = CourseCommentThread['anchorState'];

type GetCourseCommentSummarySuccess = Extract<InferResponseType<GetCourseCommentSummaryRequest>, { success: true }>;
export type CourseCommentSummary = GetCourseCommentSummarySuccess['data'];

type GetCourseCommentTeamSuccess = Extract<InferResponseType<GetCourseCommentTeamRequest>, { success: true }>;
export type CourseCommentTeamMember = GetCourseCommentTeamSuccess['data'][number];

type DeleteCourseCommentSuccess = Extract<InferResponseType<DeleteCourseCommentRequest>, { success: true }>;
export type DeleteCourseCommentResult = DeleteCourseCommentSuccess['data'];

export type CourseCommentDraftAnchor = TCourseCommentAnchorInput;
export type CourseCommentDraftKind = CourseCommentDraftAnchor['type'];

export interface CourseCommentStatusFilter {
  unread: boolean;
  read: boolean;
  resolved: boolean;
}

export interface CourseCommentContentVisibility {
  text: boolean;
  time: boolean;
  point: boolean;
}

export interface CourseCommentBlockFilter {
  lessonId: string;
  blockId: string;
  blockType: string;
}

export interface CourseCommentThreadGroup {
  key: string;
  title: string | null;
  threads: CourseCommentThread[];
}

export interface CourseCommentPageOrder {
  id: string;
  title: string;
}
