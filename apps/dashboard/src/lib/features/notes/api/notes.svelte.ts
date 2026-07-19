import {
  classroomio,
  BaseApiWithErrors,
  apiClient,
  getRequestBaseUrl,
  type InferResponseType
} from '$lib/utils/services/api';
import { currentOrg } from '$lib/utils/store/org';
import { get } from 'svelte/store';
import type {
  ConvertNoteToCourseRequest,
  ConvertNoteToTemplateRequest,
  CreateNoteFromTemplateRequest,
  CreateNoteRequest,
  DeleteNoteRequest,
  GetNoteRequest,
  GetNoteVersionHistoryRequest,
  GetNoteTagsRequest,
  ListNoteTemplatesRequest,
  ListNotesRequest,
  ListNotesSidebarRequest,
  ListTrashedNotesRequest,
  NoteTemplates,
  NoteUsageRequest,
  RestoreNoteVersionRequest,
  UnsetNoteTemplateRequest,
  UpdateNoteRequest,
  UpdateNoteTagsRequest,
  UpdateNoteVisibilityRequest,
  FavoriteNoteRequest,
  UnfavoriteNoteRequest,
  RestoreNoteRequest,
  PermanentDeleteNoteRequest
} from '../utils/types';

export type NoteListItem = Extract<InferResponseType<ListNotesRequest>, { success: true }>['data'][number];
export type SidebarNoteItem = Extract<InferResponseType<ListNotesSidebarRequest>, { success: true }>['data'][number];
export type TrashedNoteItem = Extract<InferResponseType<ListTrashedNotesRequest>, { success: true }>['data'][number];

export type NoteDetail = Extract<InferResponseType<GetNoteRequest>, { success: true }>['data'];

export type NoteUsage = Extract<InferResponseType<NoteUsageRequest>, { success: true }>['data'];

export type NoteTags = Extract<InferResponseType<GetNoteTagsRequest>, { success: true }>['data'];

export type NoteVersionHistory = Extract<InferResponseType<GetNoteVersionHistoryRequest>, { success: true }>['data'];

class NotesApi extends BaseApiWithErrors {
  notes = $state<NoteListItem[]>([]);
  sidebarNotes = $state<SidebarNoteItem[]>([]);
  trashedNotes = $state<TrashedNoteItem[]>([]);
  templates = $state<NoteTemplates>([]);
  usage = $state<NoteUsage | null>(null);
  lastListParams = $state<{
    origin?: 'workspace' | 'lesson_capture';
    courseId?: string;
    lessonId?: string;
    search?: string;
    tagId?: string;
    scope?: 'mine' | 'team' | 'all';
  } | null>(null);

  async listNotes(params?: {
    origin?: 'workspace' | 'lesson_capture';
    courseId?: string;
    lessonId?: string;
    search?: string;
    tagId?: string;
    scope?: 'mine' | 'team' | 'all';
  }) {
    const org = get(currentOrg);
    if (!org.id) return;

    this.lastListParams = params ?? null;

    await this.execute<ListNotesRequest>({
      requestFn: () =>
        classroomio.notes.$get({
          query: {
            organizationId: org.id,
            origin: params?.origin,
            courseId: params?.courseId,
            lessonId: params?.lessonId,
            search: params?.search,
            tagId: params?.tagId,
            scope: params?.scope
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
  }

  async refreshList() {
    await this.listSidebar();
  }

  async listSidebar() {
    const org = get(currentOrg);
    if (!org.id) return;

    await this.execute<ListNotesSidebarRequest>({
      requestFn: () => classroomio.notes.sidebar.$get(),
      onSuccess: (result) => {
        this.sidebarNotes = result.data;
      },
      logContext: 'listSidebarNotes',
      onError: () => {
        this.sidebarNotes = [];
      }
    });
  }

  async listTrash() {
    const org = get(currentOrg);
    if (!org.id) return;

    await this.execute<ListTrashedNotesRequest>({
      requestFn: () => classroomio.notes.trash.$get(),
      onSuccess: (result) => {
        this.trashedNotes = result.data;
      },
      logContext: 'listTrashedNotes',
      onError: () => {
        this.trashedNotes = [];
      }
    });
  }

  async favoriteNote(noteId: string) {
    await this.execute<FavoriteNoteRequest>({
      requestFn: () =>
        classroomio.notes[':noteId'].favorite.$post({
          param: { noteId }
        }),
      logContext: 'favoriteNote'
    });
  }

  async unfavoriteNote(noteId: string) {
    await this.execute<UnfavoriteNoteRequest>({
      requestFn: () =>
        classroomio.notes[':noteId'].favorite.$delete({
          param: { noteId }
        }),
      logContext: 'unfavoriteNote'
    });
  }

  async restoreNote(noteId: string) {
    let restored: NoteDetail | null = null;

    await this.execute<RestoreNoteRequest>({
      requestFn: () =>
        classroomio.notes[':noteId'].restore.$post({
          param: { noteId }
        }),
      onSuccess: (result) => {
        restored = result.data ?? null;
      },
      logContext: 'restoreNote'
    });

    return restored;
  }

  async permanentDeleteNote(noteId: string) {
    let deleted = false;

    await this.execute<PermanentDeleteNoteRequest>({
      requestFn: () =>
        classroomio.notes[':noteId'].permanent.$delete({
          param: { noteId }
        }),
      onSuccess: () => {
        deleted = true;
      },
      logContext: 'permanentDeleteNote'
    });

    return deleted;
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

  async getNote(noteId: string) {
    let note: NoteDetail | null = null;

    await this.execute<GetNoteRequest>({
      requestFn: () =>
        classroomio.notes[':noteId'].$get({
          param: { noteId }
        }),
      onSuccess: (result) => {
        note = result.data ?? null;
      },
      logContext: 'getNote'
    });

    return note;
  }

  async createWorkspaceNote(title: string, parentId?: string | null) {
    const org = get(currentOrg);
    if (!org.id) return null;

    let created: NoteDetail | null = null;

    await this.execute<CreateNoteRequest>({
      requestFn: () =>
        classroomio.notes.$post({
          json: {
            organizationId: org.id,
            title,
            content: '',
            origin: 'workspace',
            ...(parentId ? { parentId } : {})
          }
        }),
      onSuccess: (result) => {
        created = result.data ?? null;
      },
      logContext: 'createWorkspaceNote'
    });

    if (created) {
      await this.listSidebar();
    }

    return created;
  }

  async importNote(file: File) {
    const org = get(currentOrg);
    if (!org.id) return null;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.request(`${getRequestBaseUrl()}/notes/import`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const result = (await response.json()) as { success: boolean; data?: NoteDetail };

      if (result.success && result.data) {
        return result.data;
      }
    } catch (error) {
      console.error('Error importing note:', error);
    }

    return null;
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

  async updateNote(
    noteId: string,
    fields: { title?: string; content?: string; isPinned?: boolean; parentId?: string | null; sortOrder?: number }
  ) {
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

  async getNoteTags(noteId: string) {
    let tags: NoteTags = [];

    await this.execute<GetNoteTagsRequest>({
      requestFn: () =>
        classroomio.notes[':noteId'].tags.$get({
          param: { noteId }
        }),
      onSuccess: (result) => {
        tags = result.data;
      },
      logContext: 'getNoteTags'
    });

    return tags;
  }

  async updateNoteTags(noteId: string, tagIds: string[]) {
    let tags: NoteTags | null = null;

    await this.execute<UpdateNoteTagsRequest>({
      requestFn: () =>
        classroomio.notes[':noteId'].tags.$put({
          param: { noteId },
          json: { tagIds }
        }),
      onSuccess: (result) => {
        tags = result.data;
      },
      logContext: 'updateNoteTags'
    });

    return tags;
  }

  async updateNoteVisibility(noteId: string, visibility: 'private' | 'team' | 'public', slug?: string) {
    let updated: NoteDetail | null = null;

    await this.execute<UpdateNoteVisibilityRequest>({
      requestFn: () =>
        classroomio.notes[':noteId'].visibility.$put({
          param: { noteId },
          json: { visibility, ...(slug ? { slug } : {}) }
        }),
      onSuccess: (result) => {
        updated = result.data ?? null;
      },
      logContext: 'updateNoteVisibility'
    });

    return updated;
  }

  async deleteNote(noteId: string) {
    let deleted = false;

    await this.execute<DeleteNoteRequest>({
      requestFn: () =>
        classroomio.notes[':noteId'].$delete({
          param: { noteId }
        }),
      onSuccess: () => {
        deleted = true;
      },
      logContext: 'deleteNote'
    });

    return deleted;
  }

  async getVersionHistory(noteId: string, endRange = 9) {
    let versions: NoteVersionHistory = [];

    await this.execute<GetNoteVersionHistoryRequest>({
      requestFn: () =>
        classroomio.notes[':noteId'].versions.$get({
          param: { noteId },
          query: { endRange: String(endRange) }
        }),
      onSuccess: (result) => {
        versions = result.data;
      },
      logContext: 'getNoteVersionHistory'
    });

    return versions;
  }

  async listTemplates() {
    const org = get(currentOrg);
    if (!org.id) return;

    await this.execute<ListNoteTemplatesRequest>({
      requestFn: () => classroomio.notes.templates.$get(),
      onSuccess: (result) => {
        this.templates = result.data;
      },
      logContext: 'listNoteTemplates',
      onError: () => {
        this.templates = [];
      }
    });
  }

  async convertToTemplate(noteId: string) {
    let converted: NoteDetail | null = null;

    await this.execute<ConvertNoteToTemplateRequest>({
      requestFn: () =>
        classroomio.notes[':noteId']['convert-to-template'].$post({
          param: { noteId }
        }),
      onSuccess: (result) => {
        converted = result.data ?? null;
      },
      logContext: 'convertNoteToTemplate'
    });

    return converted;
  }

  async unsetTemplate(noteId: string) {
    let updated: NoteDetail | null = null;

    await this.execute<UnsetNoteTemplateRequest>({
      requestFn: () =>
        classroomio.notes[':noteId']['unset-template'].$post({
          param: { noteId }
        }),
      onSuccess: (result) => {
        updated = result.data ?? null;
      },
      logContext: 'unsetNoteTemplate'
    });

    return updated;
  }

  async convertToCourse(
    noteId: string,
    payload: {
      courseTitle: string;
      sections: Array<{ title: string; lessons: Array<{ title: string; content: string }> }>;
      unsectionedLessons: Array<{ title: string; content: string }>;
    }
  ) {
    let result: { courseId: string; courseSlug: string | null; lessonCount: number; sectionCount: number } | null =
      null;

    await this.execute<ConvertNoteToCourseRequest>({
      requestFn: () =>
        classroomio.notes[':noteId']['convert-to-course'].$post({
          param: { noteId },
          json: payload
        }),
      onSuccess: (response) => {
        result = response.data ?? null;
      },
      logContext: 'convertNoteToCourse'
    });

    return result;
  }

  async createNoteFromTemplate(templateNoteId: string) {
    const org = get(currentOrg);
    if (!org.id) return null;

    let created: NoteDetail | null = null;

    await this.execute<CreateNoteFromTemplateRequest>({
      requestFn: () =>
        classroomio.notes['from-template'].$post({
          json: {
            organizationId: org.id,
            templateNoteId
          }
        }),
      onSuccess: (result) => {
        created = result.data ?? null;
      },
      logContext: 'createNoteFromTemplate'
    });

    return created;
  }

  async restoreVersion(noteId: string, versionId: number) {
    let restored: NoteDetail | null = null;

    await this.execute<RestoreNoteVersionRequest>({
      requestFn: () =>
        classroomio.notes[':noteId'].versions[':versionId'].restore.$post({
          param: { noteId, versionId: String(versionId) }
        }),
      onSuccess: (result) => {
        restored = result.data ?? null;
      },
      logContext: 'restoreNoteVersion'
    });

    return restored;
  }
}

export const notesApi = new NotesApi();
