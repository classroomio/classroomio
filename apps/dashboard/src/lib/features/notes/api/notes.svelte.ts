import { classroomio, BaseApiWithErrors, type InferResponseType } from '$lib/utils/services/api';
import { currentOrg } from '$lib/utils/store/org';
import { get } from 'svelte/store';
import type { ListNotesRequest, NoteUsageRequest } from '../utils/types';

export type NoteListItem = Extract<InferResponseType<ListNotesRequest>, { success: true }>['data'][number];

export type NoteUsage = Extract<InferResponseType<NoteUsageRequest>, { success: true }>['data'];

class NotesApi extends BaseApiWithErrors {
  notes = $state<NoteListItem[]>([]);
  usage = $state<NoteUsage | null>(null);
  isLoading = $state(false);

  async listNotes(params?: { origin?: 'workspace' | 'lesson_capture'; search?: string }) {
    const org = get(currentOrg);
    if (!org.id) return;

    this.isLoading = true;

    await this.execute<ListNotesRequest>({
      requestFn: () =>
        classroomio.notes.$get({
          query: {
            organizationId: org.id,
            origin: params?.origin,
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
}

export const notesApi = new NotesApi();
