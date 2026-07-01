import { classroomio, BaseApiWithErrors, type InferResponseType } from '$lib/utils/services/api';
import { currentOrg } from '$lib/utils/store/org';
import { get } from 'svelte/store';
import type {
  CreateNoteRequest,
  GetNoteRequest,
  ListNotesRequest,
  NoteUsageRequest,
  UpdateNoteRequest
} from '../utils/types';

export type NoteListItem = Extract<InferResponseType<ListNotesRequest>, { success: true }>['data'][number];

export type NoteDetail = Extract<InferResponseType<GetNoteRequest>, { success: true }>['data'];

export type NoteUsage = Extract<InferResponseType<NoteUsageRequest>, { success: true }>['data'];

class NotesApi extends BaseApiWithErrors {
  notes = $state<NoteListItem[]>([]);
  usage = $state<NoteUsage | null>(null);
  isLoading = $state(false);

  async listNotes(params?: {
    origin?: 'workspace' | 'lesson_capture';
    courseId?: string;
    lessonId?: string;
    search?: string;
  }) {
    const org = get(currentOrg);
    if (!org.id) return;

    this.isLoading = true;

    await this.execute<ListNotesRequest>({
      requestFn: () =>
        classroomio.notes.$get({
          query: {
            organizationId: org.id,
            origin: params?.origin,
            courseId: params?.courseId,
            lessonId: params?.lessonId,
            search: params?.search
          }
        }),
      onSuccess: (result) => {
        this.notes = result.data;
      },
      logContext: 'listNotes',
      onError: () => {
        this.notes = [];
      }
    });

    this.isLoading = false;
  }

  async fetchUsage() {
    const org = get(currentOrg);
    if (!org.id) return;

    await this.execute<NoteUsageRequest>({
      requestFn: () => classroomio.notes.usage.$get(),
      onSuccess: (result) => {
        this.usage = result.data;
      },
      logContext: 'fetchNoteUsage'
    });
  }

  async ensureLessonCaptureNote(params: { courseId: string; lessonId: string; title: string }) {
    const org = get(currentOrg);
    if (!org.id) return null;

    let existing: NoteDetail | null = null;

    await this.execute<ListNotesRequest>({
      requestFn: () =>
        classroomio.notes.$get({
          query: {
            organizationId: org.id,
            origin: 'lesson_capture',
            courseId: params.courseId,
            lessonId: params.lessonId
          }
        }),
      onSuccess: (result) => {
        existing = result.data[0] ?? null;
      },
      logContext: 'getLessonCaptureNote'
    });

    if (existing) {
      return existing;
    }

    let created: NoteDetail | null = null;

    await this.execute<CreateNoteRequest>({
      requestFn: () =>
        classroomio.notes.$post({
          json: {
            organizationId: org.id,
            title: params.title,
            content: '',
            origin: 'lesson_capture',
            courseId: params.courseId,
            lessonId: params.lessonId
          }
        }),
      onSuccess: (result) => {
        created = result.data ?? null;
      },
      logContext: 'createLessonCaptureNote'
    });

    return created;
  }

  async updateNote(noteId: string, fields: { title?: string; content?: string }) {
    let updated: NoteDetail | null = null;

    await this.execute<UpdateNoteRequest>({
      requestFn: () =>
        classroomio.notes[':noteId'].$put({
          param: { noteId },
          json: fields
        }),
      onSuccess: (result) => {
        updated = result.data ?? null;
      },
      logContext: 'updateNote'
    });

    return updated;
  }
}

export const notesApi = new NotesApi();
