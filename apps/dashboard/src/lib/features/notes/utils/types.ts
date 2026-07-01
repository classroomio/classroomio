import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ListNotesRequest = typeof classroomio.notes.$get;
export type NoteUsageRequest = typeof classroomio.notes.usage.$get;
export type GetNoteRequest = (typeof classroomio.notes)[':noteId']['$get'];
export type CreateNoteRequest = typeof classroomio.notes.$post;
export type UpdateNoteRequest = (typeof classroomio.notes)[':noteId']['$put'];

export type NoteOrigin = 'workspace' | 'lesson_capture';
