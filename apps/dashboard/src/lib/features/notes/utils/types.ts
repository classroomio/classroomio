import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ListNotesRequest = typeof classroomio.notes.$get;
export type NoteUsageRequest = typeof classroomio.notes.usage.$get;

export type NoteOrigin = 'workspace' | 'lesson_capture';
