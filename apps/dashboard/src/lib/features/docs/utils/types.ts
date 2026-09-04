import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ListNotesRequest = typeof classroomio.doc.$get;
export type ListNotesSidebarRequest = typeof classroomio.doc.sidebar.$get;
export type ListTrashedNotesRequest = typeof classroomio.doc.trash.$get;
export type NoteUsageRequest = typeof classroomio.doc.usage.$get;
export type GetNoteRequest = (typeof classroomio.doc)[':docId']['$get'];
export type CreateNoteRequest = typeof classroomio.doc.$post;
export type UpdateNoteRequest = (typeof classroomio.doc)[':docId']['$put'];
export type DeleteNoteRequest = (typeof classroomio.doc)[':docId']['$delete'];
export type GetNoteTagsRequest = (typeof classroomio.doc)[':docId']['tags']['$get'];
export type UpdateNoteTagsRequest = (typeof classroomio.doc)[':docId']['tags']['$put'];
export type UpdateNoteVisibilityRequest = (typeof classroomio.doc)[':docId']['visibility']['$put'];
export type FavoriteNoteRequest = (typeof classroomio.doc)[':docId']['favorite']['$post'];
export type UnfavoriteNoteRequest = (typeof classroomio.doc)[':docId']['favorite']['$delete'];
export type GetNoteSharesRequest = (typeof classroomio.doc)[':docId']['shares']['$get'];
export type ReplaceNoteSharesRequest = (typeof classroomio.doc)[':docId']['shares']['$put'];
export type RestoreNoteRequest = (typeof classroomio.doc)[':docId']['restore']['$post'];
export type PermanentDeleteNoteRequest = (typeof classroomio.doc)[':docId']['permanent']['$delete'];
export type GetNoteVersionHistoryRequest = (typeof classroomio.doc)[':docId']['versions']['$get'];
export type RestoreNoteVersionRequest =
  (typeof classroomio.doc)[':docId']['versions'][':versionId']['restore']['$post'];

export type ListNoteTemplatesRequest = (typeof classroomio.doc)['templates']['$get'];
export type CreateNoteFromTemplateRequest = (typeof classroomio.doc)['from-template']['$post'];
export type CreateNoteFromCourseTemplateRequest = (typeof classroomio.doc)['from-course-template']['$post'];
export type ConvertNoteToTemplateRequest = (typeof classroomio.doc)[':docId']['convert-to-template']['$post'];
export type UnsetNoteTemplateRequest = (typeof classroomio.doc)[':docId']['unset-template']['$post'];
export type ConvertNoteToCourseRequest = (typeof classroomio.doc)[':docId']['convert-to-course']['$post'];

export type NoteTemplates = Extract<InferResponseType<ListNoteTemplatesRequest>, { success: true }>['data'];

export type DocShareVisibility = 'private' | 'team' | 'public';
export type NoteListScope = 'mine' | 'team' | 'all';

export type NoteVersionHistoryItem = Extract<
  InferResponseType<GetNoteVersionHistoryRequest>,
  { success: true }
>['data'][number];

export type ListNoteCommentThreadsRequest = (typeof classroomio.doc)[':docId']['comment-threads']['$get'];
export type CreateNoteCommentThreadRequest = (typeof classroomio.doc)[':docId']['comment-threads']['$post'];
export type AiNoteCommentReviewRequest = (typeof classroomio.doc)[':docId']['comment-threads']['ai-review']['$post'];
export type CreateNoteCommentReplyRequest =
  (typeof classroomio.doc)[':docId']['comment-threads'][':threadId']['replies']['$post'];
export type UpdateNoteCommentThreadRequest =
  (typeof classroomio.doc)[':docId']['comment-threads'][':threadId']['$patch'];
export type UpdateNoteCommentRequest = (typeof classroomio.doc)[':docId']['comments'][':commentId']['$patch'];
export type DeleteNoteCommentRequest = (typeof classroomio.doc)[':docId']['comments'][':commentId']['$delete'];

export type NoteCommentThreads = Extract<InferResponseType<ListNoteCommentThreadsRequest>, { success: true }>['data'];
export type NoteCommentThread = NoteCommentThreads[number];
export type NoteComment = NoteCommentThread['comments'][number];
export type AiNoteCommentReviewResult = Extract<
  InferResponseType<AiNoteCommentReviewRequest>,
  { success: true }
>['data'];
