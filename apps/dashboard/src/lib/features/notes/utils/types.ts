import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ListNotesRequest = typeof classroomio.notes.$get;
export type NoteUsageRequest = typeof classroomio.notes.usage.$get;
export type GetNoteRequest = (typeof classroomio.notes)[':noteId']['$get'];
export type CreateNoteRequest = typeof classroomio.notes.$post;
export type UpdateNoteRequest = (typeof classroomio.notes)[':noteId']['$put'];
export type DeleteNoteRequest = (typeof classroomio.notes)[':noteId']['$delete'];
export type GetNoteTagsRequest = (typeof classroomio.notes)[':noteId']['tags']['$get'];
export type UpdateNoteTagsRequest = (typeof classroomio.notes)[':noteId']['tags']['$put'];
export type GetNoteVersionHistoryRequest = (typeof classroomio.notes)[':noteId']['versions']['$get'];
export type RestoreNoteVersionRequest =
  (typeof classroomio.notes)[':noteId']['versions'][':versionId']['restore']['$post'];

export type NoteOrigin = 'workspace' | 'lesson_capture';

export type NoteVersionHistoryItem = Extract<
  InferResponseType<GetNoteVersionHistoryRequest>,
  { success: true }
>['data'][number];
