import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  CourseSectionWithLessons,
  CreateCourseSectionRequest,
  CreateLessonComment,
  CreateLessonCommentRequest,
  CreateLessonRequest,
  DeleteCourseSectionRequest,
  DeleteLessonCommentRequest,
  DeleteLessonRequest,
  GetLessonCommentsRequest,
  GetLessonHistoryRequest,
  GetLessonLanguageRequest,
  GetLessonRequest,
  Lesson,
  LessonComments,
  ReorderCourseSectionsRequest,
  ReorderLessonsRequest,
  UpdateCourseSectionRequest,
  UpdateLessonCommentRequest,
  UpdateLessonCompletionRequest,
  UpdateLessonRequest
} from '../utils/types';
import type {
  TCourseSectionCreate,
  TCourseSectionReorder,
  TCourseSectionUpdate
} from '@cio/utils/validation/course/section';
import type { TLessonCreate, TLessonReorder, TLessonUpdate } from '@cio/utils/validation/lesson';
import {
  ZCourseSectionCreate,
  ZCourseSectionReorder,
  ZCourseSectionUpdate
} from '@cio/utils/validation/course/section';
import {
  ZLessonCommentCreate,
  ZLessonCommentUpdate,
  ZLessonCompletionUpdate,
  ZLessonCreate,
  ZLessonReorder,
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
  sections = $state<CourseSectionWithLessons[]>([]);
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
  currentLocale = $state<TLocale>('en');
  isSaving = $state(false);
  isDirty = $state(false);
  isCommenting = $state(false);
  isUpdatingComment = $state(false);

  translations = $state<Record<string, Record<TLocale, string>>>({});
  note = $state('');
  private autoSaveTimeoutId: NodeJS.Timeout | null = null;

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

    this.isSaving = true;

    await this.execute<UpdateLessonRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].$put({
          param: { courseId, lessonId },
          json: result.data
        }),
      logContext: 'updating lesson',
      onError: (result) => {
        console.log('onError', result);
        snackbar.error('Failed to update lesson');
      }
    });

    this.isSaving = false;
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

  // Course Section methods

  /**
   * Creates a course section
   */
  async createSection(courseId: string, fields: TCourseSectionCreate) {
    const result = ZCourseSectionCreate.safeParse({ ...fields, courseId });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'lesson');
      return;
    }

    await this.execute<CreateCourseSectionRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].section.$post({
          param: { courseId },
          json: result.data
        }),
      logContext: 'creating course section',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Course section created successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to create course section');
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
   * Updates a course section
   */
  async updateSection(courseId: string, sectionId: string, fields: TCourseSectionUpdate) {
    const result = ZCourseSectionUpdate.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'lesson');
      return;
    }

    await this.execute<UpdateCourseSectionRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].section[':sectionId'].$put({
          param: { courseId, sectionId },
          json: result.data
        }),
      logContext: 'updating course section',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Course section updated successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to update course section');
        }
      }
    });
  }

  /**
   * Deletes a course section
   */
  async deleteSection(courseId: string, sectionId: string) {
    await this.execute<DeleteCourseSectionRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].section[':sectionId'].$delete({
          param: { courseId, sectionId }
        }),
      logContext: 'deleting course section'
    });
  }

  /**
   * Reorders course sections
   */
  async reorderSections(courseId: string, sections: TCourseSectionReorder['sections']) {
    const result = ZCourseSectionReorder.safeParse({ sections });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'lesson');
      return;
    }

    await this.execute<ReorderCourseSectionsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].section.reorder.$post({
          param: { courseId },
          json: result.data
        }),
      logContext: 'reordering course sections',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Course sections reordered successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to reorder course sections');
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
    if (!courseId || !lessonId) {
      snackbar.error('Failed to add comment');
      return;
    }

    const result = ZLessonCommentCreate.safeParse({ lessonId, comment });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'lesson');
      return;
    }

    this.isCommenting = true;
    try {
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
    } finally {
      this.isCommenting = false;
    }
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

    this.success = false;
    this.isUpdatingComment = true;

    try {
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
    } finally {
      this.isUpdatingComment = false;
    }
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
          // Update the current lesson if it's the one being updated
          if (this.lesson?.id === lessonId) {
            this.lesson = { ...this.lesson, isComplete };
          }
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

  updateTranslation(lessonId: string, locale: TLocale, content: string) {
    this.translations = {
      ...this.translations,
      [lessonId]: {
        ...this.translations[lessonId],
        [locale]: content
      }
    };
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
  async getHistory(courseId: string, lessonId: string, locale: TLocale, endRange: number) {
    return this.execute<GetLessonHistoryRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['lesson'][':lessonId']['history'].$get({
          param: { courseId, lessonId },
          query: { locale, endRange: endRange.toString() }
        }),
      logContext: 'fetching lesson history'
    });
  }

  /**
   * Creates or updates a lesson language translation (upsert)
   * @param courseId Course ID
   * @param lessonId Lesson ID
   * @param locale Locale
   * @param content Translation content
   */
  async upsertLanguage(courseId: string, lessonId: string, locale: TLocale, content: string) {
    return this.execute<GetLessonLanguageRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].language.$post({
          param: { courseId, lessonId },
          json: { locale, content }
        }),
      logContext: 'upserting lesson language',
      onSuccess: () => {
        this.success = true;
        this.errors = {};
      },
      onError: () => {
        snackbar.error('snackbar.materials.update_translations');
      }
    });
  }

  /**
   * Saves the current lesson state (materials and translations)
   * @param courseId Course ID
   * @param lessonId Lesson ID
   */
  async save(courseId: string, lessonId: string) {
    if (!this.lesson) return false;

    // Prevent autosave loops: we only set this back to `true` when the user edits again.
    this.isDirty = false;

    await Promise.all([
      this.update(courseId, lessonId, {
        slideUrl: this.lesson.slideUrl || undefined,
        videos: this.lesson.videos || [],
        documents: this.lesson.documents || []
      }),
      this.upsertLanguage(
        courseId,
        lessonId,
        this.currentLocale,
        this.translations[lessonId]?.[this.currentLocale] || ''
      )
    ]);
  }

  /**
   * Starts autosave with debouncing
   * @param courseId Course ID
   * @param lessonId Lesson ID
   */
  startAutoSave(courseId: string, lessonId: string) {
    if (!this.isDirty || this.isSaving) return;
    if (this.autoSaveTimeoutId) clearTimeout(this.autoSaveTimeoutId);

    this.isSaving = true;
    this.autoSaveTimeoutId = setTimeout(async () => {
      await this.save(courseId, lessonId);
      this.isSaving = false;
      this.autoSaveTimeoutId = null;
    }, 1500);
  }
}

export const lessonApi = new LessonApi();
