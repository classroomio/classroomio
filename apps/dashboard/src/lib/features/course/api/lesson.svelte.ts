import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  CreateLessonComment,
  CreateLessonCommentRequest,
  CreateLessonRequest,
  CreateLessonSectionRequest,
  DeleteLessonCommentRequest,
  DeleteLessonRequest,
  DeleteLessonSectionRequest,
  GetLessonCommentsRequest,
  GetLessonCompletionRequest,
  GetLessonHistoryRequest,
  GetLessonRequest,
  Lesson,
  LessonComments,
  LessonCompletion,
  LessonSectionWithLessons,
  ListLessons,
  ListLessonsRequest,
  ReorderLessonSectionsRequest,
  ReorderLessonsRequest,
  UpdateLessonCommentRequest,
  UpdateLessonCompletionRequest,
  UpdateLessonRequest,
  UpdateLessonSectionRequest
} from '../utils/types';
import type {
  TLessonCreate,
  TLessonReorder,
  TLessonSectionCreate,
  TLessonSectionReorder,
  TLessonSectionUpdate,
  TLessonUpdate
} from '@cio/utils/validation/lesson';
import {
  ZLessonCommentCreate,
  ZLessonCommentUpdate,
  ZLessonCompletionUpdate,
  ZLessonCreate,
  ZLessonReorder,
  ZLessonSectionCreate,
  ZLessonSectionReorder,
  ZLessonSectionUpdate,
  ZLessonUpdate
} from '@cio/utils/validation/lesson';

import type { TLocale } from '@cio/db/types';
import { get } from 'svelte/store';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { profile } from '$lib/utils/store/user';
import { snackbar } from '$features/ui/snackbar/store';

/**
 * API class for lesson operations
 */
export class LessonApi extends BaseApiWithErrors {
  lesson = $state<Lesson | null>(null);
  lessons = $state<ListLessons>([]);
  sections = $state<LessonSectionWithLessons[]>([]);
  commentsByLessonId = $state<
    Record<
      string,
      {
        items: LessonComments;
        totalCount: number;
        hasMore: boolean;
        isLoading: boolean;
        cursor: string | null;
      }
    >
  >({});
  translations = $state<Record<string, Record<TLocale, string>>>({});
  completion = $state<LessonCompletion | null>(null);
  currentLocale = $state<TLocale>('en');
  isSaving = $state(false);
  isDirty = $state(false);

  note = $derived(this.translations[this.lesson?.id || '']?.[this.currentLocale] || this.lesson?.note || '');

  /**
   * Lists lessons for a course
   */
  async list(courseId: string, sectionId?: string) {
    await this.execute<ListLessonsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson.$get({
          param: { courseId },
          query: { courseId, sectionId }
        }),
      logContext: 'listing lessons',
      onSuccess: (response) => {
        if (response.data) {
          this.lessons = response.data;
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        console.error(result);
        snackbar.error('Failed to list lessons');
      }
    });
  }

  /**
   * Gets a lesson by ID
   */
  async get(courseId: string, lessonId: string) {
    return this.execute<GetLessonRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].$get({
          param: { courseId, lessonId }
        }),
      logContext: 'fetching lesson',
      onSuccess: (response) => {
        if (response.data) {
          this.lesson = response.data;

          if (this.lesson.lessonLanguages) {
            this.setTranslations();
          }

          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to fetch lesson');
        }
      }
    });
  }

  /**
   * Creates a new lesson
   */
  async create(courseId: string, fields: TLessonCreate) {
    const result = ZLessonCreate.safeParse({ ...fields, courseId });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'lesson');
      return;
    }

    await this.execute<CreateLessonRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson.$post({
          param: { courseId },
          json: result.data
        }),
      logContext: 'creating lesson',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Lesson created successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to create lesson');
          return;
        }
        if ('error' in result && 'field' in result && result.field) {
          this.errors[result.field] = result.error;
          snackbar.error(result.error);
        } else if ('error' in result) {
          this.errors.general = result.error;
          snackbar.error(result.error);
        }
      }
    });
  }

  /**
   * Updates a lesson
   */
  async update(courseId: string, lessonId: string, fields: TLessonUpdate) {
    const result = ZLessonUpdate.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'lesson');
      return;
    }

    await this.execute<UpdateLessonRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].$put({
          param: { courseId, lessonId },
          json: result.data
        }),
      logContext: 'updating lesson',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Lesson updated successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to update lesson');
          return;
        }
        if ('error' in result && 'field' in result && result.field) {
          this.errors[result.field] = result.error;
          snackbar.error(result.error);
        } else if ('error' in result) {
          this.errors.general = result.error;
          snackbar.error(result.error);
        }
      }
    });
  }

  /**
   * Deletes a lesson
   */
  async delete(courseId: string, lessonId: string) {
    await this.execute<DeleteLessonRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].$delete({
          param: { courseId, lessonId }
        }),
      logContext: 'deleting lesson',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Lesson deleted successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to delete lesson');
        }
      }
    });
  }

  // Lesson Section methods

  /**
   * Creates a lesson section
   */
  async createSection(courseId: string, fields: TLessonSectionCreate) {
    const result = ZLessonSectionCreate.safeParse({ ...fields, courseId });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'lesson');
      return;
    }

    await this.execute<CreateLessonSectionRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson.section.$post({
          param: { courseId },
          json: result.data
        }),
      logContext: 'creating lesson section',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Lesson section created successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to create lesson section');
          return;
        }
        if ('error' in result && 'field' in result && result.field) {
          this.errors[result.field] = result.error;
          snackbar.error(result.error);
        }
      }
    });
  }

  /**
   * Updates a lesson section
   */
  async updateSection(courseId: string, sectionId: string, fields: TLessonSectionUpdate) {
    const result = ZLessonSectionUpdate.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'lesson');
      return;
    }

    await this.execute<UpdateLessonSectionRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson.section[':sectionId'].$put({
          param: { courseId, sectionId },
          json: result.data
        }),
      logContext: 'updating lesson section',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Lesson section updated successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to update lesson section');
        }
      }
    });
  }

  /**
   * Deletes a lesson section
   */
  async deleteSection(courseId: string, sectionId: string) {
    await this.execute<DeleteLessonSectionRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson.section[':sectionId'].$delete({
          param: { courseId, sectionId }
        }),
      logContext: 'deleting lesson section',
      onSuccess: (response) => {
        if (response.data) {
          // Update state: remove section and lessons in that section
          this.sections = this.sections.filter((section) => section.id !== sectionId);
          this.lessons = this.lessons.filter((lesson) => lesson.sectionId !== sectionId);
          snackbar.success('snackbar.generic.success_delete');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to delete lesson section');
        }
      }
    });
  }

  /**
   * Reorders lesson sections
   */
  async reorderSections(courseId: string, sections: TLessonSectionReorder['sections']) {
    const result = ZLessonSectionReorder.safeParse({ sections });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'lesson');
      return;
    }

    await this.execute<ReorderLessonSectionsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson.section.reorder.$post({
          param: { courseId },
          json: result.data
        }),
      logContext: 'reordering lesson sections',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Lesson sections reordered successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to reorder lesson sections');
        }
      }
    });
  }

  /**
   * Reorders lessons
   */
  async reorderLessons(courseId: string, lessons: TLessonReorder['lessons']) {
    const result = ZLessonReorder.safeParse({ lessons });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'lesson');
      return;
    }

    await this.execute<ReorderLessonsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson.reorder.$post({
          param: { courseId },
          json: result.data
        }),
      logContext: 'reordering lessons',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Lessons reordered successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to reorder lessons');
        }
      }
    });
  }

  // Lesson Comment methods

  /**
   * Initializes comments state for a lesson
   */
  initComments(lessonId: string, totalCount: number) {
    if (!this.commentsByLessonId[lessonId]) {
      this.commentsByLessonId[lessonId] = {
        items: [],
        totalCount,
        hasMore: totalCount > 0,
        isLoading: false,
        cursor: null
      };
    }
  }

  /**
   * Gets comments for a lesson
   */
  async getComments(courseId: string, lessonId: string, limit = 10) {
    if (!this.commentsByLessonId[lessonId]) {
      this.initComments(lessonId, 0);
    }
    this.commentsByLessonId[lessonId].isLoading = true;

    await this.execute<GetLessonCommentsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].comment.$get({
          param: { courseId, lessonId },
          query: { limit: String(limit) }
        }),
      logContext: 'fetching lesson comments',
      onSuccess: (response) => {
        if (response.data) {
          this.commentsByLessonId[lessonId] = {
            items: response.data.items,
            totalCount: response.data.totalCount,
            hasMore: response.data.hasMore,
            isLoading: false,
            cursor: response.data.nextCursor
          };
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        this.commentsByLessonId[lessonId].isLoading = false;
        if (typeof result === 'string') {
          snackbar.error('Failed to fetch lesson comments');
        }
      }
    });
  }

  /**
   * Load more comments (uses cursor)
   */
  async loadMoreComments(courseId: string, lessonId: string, limit = 10) {
    const commentState = this.commentsByLessonId[lessonId];
    if (!commentState || !commentState.hasMore || commentState.isLoading || !commentState.cursor) {
      return;
    }

    commentState.isLoading = true;

    await this.execute<GetLessonCommentsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].comment.$get({
          param: { courseId, lessonId },
          query: { cursor: commentState.cursor!, limit: String(limit) }
        }),
      logContext: 'loading more lesson comments',
      onSuccess: (response) => {
        if (response.data) {
          this.commentsByLessonId[lessonId] = {
            items: [...commentState.items, ...response.data.items],
            totalCount: response.data.totalCount,
            hasMore: response.data.hasMore,
            isLoading: false,
            cursor: response.data.nextCursor
          };
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        commentState.isLoading = false;
        if (typeof result === 'string') {
          snackbar.error('Failed to load more comments');
        }
      }
    });
  }

  /**
   * Creates a lesson comment
   */
  async createComment(courseId: string, lessonId: string, comment: string) {
    const result = ZLessonCommentCreate.safeParse({ comment });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'lesson');
      return;
    }

    await this.execute<CreateLessonCommentRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].comment.$post({
          param: { courseId, lessonId },
          json: result.data
        }),
      logContext: 'creating lesson comment',
      onSuccess: (response) => {
        if (response.data && this.commentsByLessonId[lessonId]) {
          this.commentsByLessonId[lessonId].items = [
            this.getCommentFromResponse(response.data),
            ...this.commentsByLessonId[lessonId].items
          ];
          this.commentsByLessonId[lessonId].totalCount++;
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to add comment');
        }
      }
    });
  }

  /**
   * Updates a lesson comment
   */
  async updateComment(courseId: string, lessonId: string, commentId: string, comment: string) {
    const result = ZLessonCommentUpdate.safeParse({ comment });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'lesson');
      return;
    }

    await this.execute<UpdateLessonCommentRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson.comment[':commentId'].$put({
          param: { courseId, commentId },
          json: result.data
        }),
      logContext: 'updating lesson comment',
      onSuccess: (response) => {
        if (response.data) {
          // Update local state
          if (this.commentsByLessonId[lessonId]) {
            this.commentsByLessonId[lessonId].items = this.commentsByLessonId[lessonId].items.map((c) =>
              c.id === Number(commentId) ? this.getCommentFromResponse(response.data) : c
            );
          }
          snackbar.success('Comment updated successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to update comment');
        }
      }
    });
  }

  /**
   * Deletes a lesson comment
   */
  async deleteComment(courseId: string, lessonId: string, commentId: string) {
    await this.execute<DeleteLessonCommentRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson.comment[':commentId'].$delete({
          param: { courseId, commentId }
        }),
      logContext: 'deleting lesson comment',
      onSuccess: (response) => {
        if (response.data) {
          // Update local state
          if (this.commentsByLessonId[lessonId]) {
            this.commentsByLessonId[lessonId].items = this.commentsByLessonId[lessonId].items.filter(
              (c) => c.id !== Number(commentId)
            );
            this.commentsByLessonId[lessonId].totalCount--;
          }
          snackbar.success('Comment deleted successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to delete comment');
        }
      }
    });
  }

  // Lesson Completion methods

  /**
   * Gets lesson completion status
   */
  async getCompletion(courseId: string, lessonId: string) {
    await this.execute<GetLessonCompletionRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].completion.$get({
          param: { courseId, lessonId }
        }),
      logContext: 'fetching lesson completion',
      onSuccess: (response) => {
        if (response.data) {
          this.completion = response.data;
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to fetch lesson completion');
        }
      }
    });
  }

  /**
   * Updates lesson completion
   */
  async updateCompletion(courseId: string, lessonId: string, isComplete: boolean) {
    const result = ZLessonCompletionUpdate.safeParse({ isComplete });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'lesson');
      return;
    }

    await this.execute<UpdateLessonCompletionRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].completion.$put({
          param: { courseId, lessonId },
          json: result.data
        }),
      logContext: 'updating lesson completion',
      onSuccess: (response) => {
        if (response.data) {
          this.completion = response.data;
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to update lesson completion');
        }
      }
    });
  }

  /**
   * Sets translations for a lesson
   * Translations are stored separately from the lesson data
   */
  setTranslations() {
    if (!this.lesson) return;

    const translations: Record<TLocale, string> = this.lesson?.lessonLanguages?.reduce(
      (acc, cur) => {
        if (cur.locale) {
          acc[cur.locale] = cur.content || '';
        }
        return acc;
      },
      {} as Record<TLocale, string>
    );

    this.translations = {
      ...this.translations,
      [this.lesson.id]: translations
    };
  }

  /**
   * Adds a new lesson to the lessons list (optimistic update)
   * This replaces handleAddLesson from the store
   */
  addLessonToList(courseId: string) {
    // Timestamps will be set by the server when the lesson is created
    const newLesson = {
      id: '',
      title: 'Untitled lesson',
      lessonAt: '',
      isUnlocked: false,
      courseId,
      createdAt: '',
      updatedAt: null,
      note: null,
      videoUrl: null,
      slideUrl: null,
      public: false,
      isComplete: false,
      callUrl: null,
      order: 0,
      teacherId: null,
      sectionId: null,
      videos: [],
      documents: []
    };

    this.lessons = [...this.lessons, newLesson];
  }

  getCommentFromResponse(response: CreateLessonComment): LessonComments[number] {
    const userProfile = get(profile);

    return {
      id: response.id,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      lessonId: response.lessonId,
      groupmemberId: response.groupmemberId,
      comment: response.comment,
      groupmember: {
        id: response.groupmemberId!
      },
      profile: {
        fullname: userProfile.fullname,
        avatarUrl: userProfile.avatarUrl
      }
    };
  }

  /**
   * Deletes a video from lesson materials
   */
  deleteLessonVideo(videoIndex: number) {
    if (!this.lesson) return;

    const videos = Array.isArray(this.lesson.videos) ? [...this.lesson.videos] : [];
    this.lesson = {
      ...this.lesson,
      videos: videos.filter((_v, i) => i !== videoIndex)
    };
    this.isDirty = true;
  }

  /**
   * Deletes a document from lesson materials
   */
  deleteLessonDocument(documentIndex: number) {
    if (!this.lesson) return;

    const documents = Array.isArray(this.lesson.documents) ? [...this.lesson.documents] : [];
    this.lesson = {
      ...this.lesson,
      documents: documents.filter((_d, i) => i !== documentIndex)
    };
    this.isDirty = true;
  }

  /**
   * Generic method to update lesson state
   * @param field - The field name to update (type-safe)
   * @param value - The new value for the field (or array of items to append)
   * @param options - Optional configuration for array operations
   */
  updateLessonState<K extends keyof Lesson>(
    field: K,
    value: Lesson[K] | (Lesson[K] extends Array<infer T> ? T | T[] : never),
    options?: { append?: boolean }
  ) {
    if (!this.lesson) return;

    // Handle array fields with append option
    if (options?.append && Array.isArray(this.lesson[field])) {
      const existingArray = this.lesson[field];
      const newItems = Array.isArray(value) ? value : [value];

      this.lesson = {
        ...this.lesson,
        [field]: [...existingArray, ...newItems] as Lesson[K]
      };
    } else {
      // Direct field replacement
      this.lesson = {
        ...this.lesson,
        [field]: value as Lesson[K]
      };
    }
    this.isDirty = true;
  }

  /**
   * Gets lesson version history for a lesson and locale
   * @param courseId Course ID
   * @param lessonId Lesson ID
   * @param locale Locale
   * @param endRange End range for pagination (0-indexed, inclusive)
   * @returns Lesson history data or null on error
   */
  async getHistory(courseId: string, lessonId: string, locale: string, endRange: number) {
    return this.execute<GetLessonHistoryRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['lesson'][':lessonId']['history'].$get({
          param: { courseId, lessonId },
          query: { locale, endRange: endRange.toString() }
        }),
      logContext: 'fetching lesson history',
      onSuccess: (response) => {
        if (response.data) {
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to fetch lesson history');
        }
      }
    });
  }
}

export const lessonApi = new LessonApi();
