import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ListNotesRequest = typeof classroomio.notes.$get;
export type NoteUsageRequest = typeof classroomio.notes.usage.$get;
export type GetNoteRequest = (typeof classroomio.notes)[':noteId']['$get'];
export type CreateNoteRequest = typeof classroomio.notes.$post;
export type UpdateNoteRequest = (typeof classroomio.notes)[':noteId']['$put'];
export type DeleteNoteRequest = (typeof classroomio.notes)[':noteId']['$delete'];
export type GetNoteTagsRequest = (typeof classroomio.notes)[':noteId']['tags']['$get'];
export type UpdateNoteTagsRequest = (typeof classroomio.notes)[':noteId']['tags']['$put'];
export type UpdateNoteVisibilityRequest = (typeof classroomio.notes)[':noteId']['visibility']['$put'];
export type GetNoteVersionHistoryRequest = (typeof classroomio.notes)[':noteId']['versions']['$get'];
export type RestoreNoteVersionRequest =
  (typeof classroomio.notes)[':noteId']['versions'][':versionId']['restore']['$post'];

export type NoteShareVisibility = 'private' | 'team';
export type NoteListScope = 'mine' | 'team' | 'all';

export type NoteVersionHistoryItem = Extract<
  InferResponseType<GetNoteVersionHistoryRequest>,
  { success: true }
>['data'][number];

export type ListNoteCommentThreadsRequest = (typeof classroomio.notes)[':noteId']['comment-threads']['$get'];
export type CreateNoteCommentThreadRequest = (typeof classroomio.notes)[':noteId']['comment-threads']['$post'];
export type CreateNoteCommentReplyRequest =
  (typeof classroomio.notes)[':noteId']['comment-threads'][':threadId']['replies']['$post'];
export type UpdateNoteCommentThreadRequest =
  (typeof classroomio.notes)[':noteId']['comment-threads'][':threadId']['$patch'];

export type NoteCommentThreads = Extract<InferResponseType<ListNoteCommentThreadsRequest>, { success: true }>['data'];
export type NoteCommentThread = NoteCommentThreads[number];
export type NoteComment = NoteCommentThread['comments'][number];
