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
  PermanentDeleteNoteRequest,
  GetNoteSharesRequest,
  ReplaceNoteSharesRequest,
  CreateNoteFromCourseTemplateRequest
} from '../utils/types';

export type DocListItem = Extract<InferResponseType<ListNotesRequest>, { success: true }>['data'][number];
export type SidebarDocItem = Extract<InferResponseType<ListNotesSidebarRequest>, { success: true }>['data'][number];
export type TrashedNoteItem = Extract<InferResponseType<ListTrashedNotesRequest>, { success: true }>['data'][number];

export type DocDetail = Extract<InferResponseType<GetNoteRequest>, { success: true }>['data'];

export type NoteUsage = Extract<InferResponseType<NoteUsageRequest>, { success: true }>['data'];

export type NoteTags = Extract<InferResponseType<GetNoteTagsRequest>, { success: true }>['data'];

export type NoteVersionHistory = Extract<InferResponseType<GetNoteVersionHistoryRequest>, { success: true }>['data'];

class NotesApi extends BaseApiWithErrors {
  notes = $state<DocListItem[]>([]);
  sidebarNotes = $state<SidebarDocItem[]>([]);
  trashedNotes = $state<TrashedNoteItem[]>([]);
  templates = $state<NoteTemplates>([]);
  usage = $state<NoteUsage | null>(null);
  lastListParams = $state<{
    origin?: 'organization' | 'lesson_capture';
    courseId?: string;
    lessonId?: string;
    search?: string;
    tagId?: string;
    scope?: 'mine' | 'team' | 'all';
  } | null>(null);

  async listNotes(params?: {
    origin?: 'organization' | 'lesson_capture';
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
        classroomio.doc.$get({
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
      requestFn: () => classroomio.doc.sidebar.$get(),
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
      requestFn: () => classroomio.doc.trash.$get(),
      onSuccess: (result) => {
        this.trashedNotes = result.data;
      },
      logContext: 'listTrashedDocs',
      onError: () => {
        this.trashedNotes = [];
      }
    });
  }

  async favoriteNote(docId: string) {
    await this.execute<FavoriteNoteRequest>({
      requestFn: () =>
        classroomio.doc[':docId'].favorite.$post({
          param: { docId }
        }),
      logContext: 'favoriteNote'
    });
  }

  async unfavoriteNote(docId: string) {
    await this.execute<UnfavoriteNoteRequest>({
      requestFn: () =>
        classroomio.doc[':docId'].favorite.$delete({
          param: { docId }
        }),
      logContext: 'unfavoriteNote'
    });
  }

  async restoreDoc(docId: string) {
    let restored: DocDetail | null = null;

    await this.execute<RestoreNoteRequest>({
      requestFn: () =>
        classroomio.doc[':docId'].restore.$post({
          param: { docId }
        }),
      onSuccess: (result) => {
        restored = result.data ?? null;
      },
      logContext: 'restoreDoc'
    });

    return restored;
  }

  async permanentDeleteNote(docId: string) {
    let deleted = false;

    await this.execute<PermanentDeleteNoteRequest>({
      requestFn: () =>
        classroomio.doc[':docId'].permanent.$delete({
          param: { docId }
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
      requestFn: () => classroomio.doc.usage.$get(),
      onSuccess: (result) => {
        this.usage = result.data;
      },
      logContext: 'fetchNoteUsage'
    });
  }

  async getNote(docId: string) {
    let note: DocDetail | null = null;

    await this.execute<GetNoteRequest>({
      requestFn: () =>
        classroomio.doc[':docId'].$get({
          param: { docId }
        }),
      onSuccess: (result) => {
        note = result.data ?? null;
      },
      logContext: 'getNote'
    });

    return note;
  }

  async createOrganizationDoc(title: string, parentId?: string | null) {
    const org = get(currentOrg);
    if (!org.id) return null;

    let created: DocDetail | null = null;

    await this.execute<CreateNoteRequest>({
      requestFn: () =>
        classroomio.doc.$post({
          json: {
            organizationId: org.id,
            title,
            content: '',
            origin: 'organization',
            ...(parentId ? { parentId } : {})
          }
        }),
      onSuccess: (result) => {
        created = result.data ?? null;
      },
      logContext: 'createOrganizationDoc'
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
      const response = await apiClient.request(`${getRequestBaseUrl()}/docs/import`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const result = (await response.json()) as { success: boolean; data?: DocDetail };

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

    let existing: DocDetail | null = null;

    await this.execute<ListNotesRequest>({
      requestFn: () =>
        classroomio.doc.$get({
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

    let created: DocDetail | null = null;

    await this.execute<CreateNoteRequest>({
      requestFn: () =>
        classroomio.doc.$post({
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

  async updateDoc(
    docId: string,
    fields: {
      title?: string;
      content?: string;
      isPinned?: boolean;
      parentId?: string | null;
      sortOrder?: number;
      coverImageUrl?: string | null;
    }
  ) {
    let updated: DocDetail | null = null;

    await this.execute<UpdateNoteRequest>({
      requestFn: () =>
        classroomio.doc[':docId'].$put({
          param: { docId },
          json: fields
        }),
      onSuccess: (result) => {
        updated = result.data ?? null;
      },
      logContext: 'updateDoc'
    });

    return updated;
  }

  async getNoteTags(docId: string) {
    let tags: NoteTags = [];

    await this.execute<GetNoteTagsRequest>({
      requestFn: () =>
        classroomio.doc[':docId'].tags.$get({
          param: { docId }
        }),
      onSuccess: (result) => {
        tags = result.data;
      },
      logContext: 'getNoteTags'
    });

    return tags;
  }

  async updateDocTags(docId: string, tagIds: string[]) {
    let tags: NoteTags | null = null;

    await this.execute<UpdateNoteTagsRequest>({
      requestFn: () =>
        classroomio.doc[':docId'].tags.$put({
          param: { docId },
          json: { tagIds }
        }),
      onSuccess: (result) => {
        tags = result.data;
      },
      logContext: 'updateDocTags'
    });

    return tags;
  }

  async updateDocVisibility(docId: string, visibility: 'private' | 'team' | 'public', slug?: string) {
    let updated: DocDetail | null = null;

    await this.execute<UpdateNoteVisibilityRequest>({
      requestFn: () =>
        classroomio.doc[':docId'].visibility.$put({
          param: { docId },
          json: { visibility, ...(slug ? { slug } : {}) }
        }),
      onSuccess: (result) => {
        updated = result.data ?? null;
      },
      logContext: 'updateDocVisibility'
    });

    return updated;
  }

  async deleteNote(docId: string) {
    let deleted = false;

    await this.execute<DeleteNoteRequest>({
      requestFn: () =>
        classroomio.doc[':docId'].$delete({
          param: { docId }
        }),
      onSuccess: () => {
        deleted = true;
      },
      logContext: 'deleteNote'
    });

    return deleted;
  }

  async getVersionHistory(docId: string, endRange = 9) {
    let versions: NoteVersionHistory = [];

    await this.execute<GetNoteVersionHistoryRequest>({
      requestFn: () =>
        classroomio.doc[':docId'].versions.$get({
          param: { docId },
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
      requestFn: () => classroomio.doc.templates.$get(),
      onSuccess: (result) => {
        this.templates = result.data;
      },
      logContext: 'listDocTemplates',
      onError: () => {
        this.templates = [];
      }
    });
  }

  async convertToTemplate(docId: string) {
    let converted: DocDetail | null = null;

    await this.execute<ConvertNoteToTemplateRequest>({
      requestFn: () =>
        classroomio.doc[':docId']['convert-to-template'].$post({
          param: { docId }
        }),
      onSuccess: (result) => {
        converted = result.data ?? null;
      },
      logContext: 'convertNoteToTemplate'
    });

    return converted;
  }

  async unsetTemplate(docId: string) {
    let updated: DocDetail | null = null;

    await this.execute<UnsetNoteTemplateRequest>({
      requestFn: () =>
        classroomio.doc[':docId']['unset-template'].$post({
          param: { docId }
        }),
      onSuccess: (result) => {
        updated = result.data ?? null;
      },
      logContext: 'unsetNoteTemplate'
    });

    return updated;
  }

  async convertToCourse(
    docId: string,
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
        classroomio.doc[':docId']['convert-to-course'].$post({
          param: { docId },
          json: payload
        }),
      onSuccess: (response) => {
        result = response.data ?? null;
      },
      logContext: 'convertNoteToCourse'
    });

    return result;
  }

  async createDocFromTemplate(templateNoteId: string) {
    const org = get(currentOrg);
    if (!org.id) return null;

    let created: DocDetail | null = null;

    await this.execute<CreateNoteFromTemplateRequest>({
      requestFn: () =>
        classroomio.doc['from-template'].$post({
          json: {
            organizationId: org.id,
            templateNoteId
          }
        }),
      onSuccess: (result) => {
        created = result.data ?? null;
      },
      logContext: 'createDocFromTemplate'
    });

    return created;
  }

  async createFromCourseTemplate(templateId: string) {
    const org = get(currentOrg);
    if (!org.id) return null;

    let result: { rootNote: DocDetail; children: DocDetail[] } | null = null;

    await this.execute<CreateNoteFromCourseTemplateRequest>({
      requestFn: () =>
        classroomio.doc['from-course-template'].$post({
          json: {
            organizationId: org.id,
            templateId
          }
        }),
      onSuccess: (response) => {
        result = response.data ?? null;
      },
      logContext: 'createFromCourseTemplate'
    });

    return result;
  }

  async getNoteShares(docId: string) {
    let shares: Extract<InferResponseType<GetNoteSharesRequest>, { success: true }>['data'] = [];

    await this.execute<GetNoteSharesRequest>({
      requestFn: () =>
        classroomio.doc[':docId'].shares.$get({
          param: { docId }
        }),
      onSuccess: (response) => {
        shares = response.data;
      },
      logContext: 'getNoteShares'
    });

    return shares;
  }

  async replaceNoteShares(docId: string, grants: Array<{ profileId: string; permission: 'read' | 'write' }>) {
    let shares: Extract<InferResponseType<ReplaceNoteSharesRequest>, { success: true }>['data'] | null = null;

    await this.execute<ReplaceNoteSharesRequest>({
      requestFn: () =>
        classroomio.doc[':docId'].shares.$put({
          param: { docId },
          json: { grants }
        }),
      onSuccess: (response) => {
        shares = response.data;
      },
      logContext: 'replaceNoteShares'
    });

    return shares;
  }

  async restoreVersion(docId: string, versionId: number) {
    let restored: DocDetail | null = null;

    await this.execute<RestoreNoteVersionRequest>({
      requestFn: () =>
        classroomio.doc[':docId'].versions[':versionId'].restore.$post({
          param: { docId, versionId: String(versionId) }
        }),
      onSuccess: (result) => {
        restored = result.data ?? null;
      },
      logContext: 'restoreDocVersion'
    });

    return restored;
  }
}

export const docsApi = new NotesApi();
