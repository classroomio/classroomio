import { ErrorCodes } from '@cio/utils/constants';
import { fromMentionMarkup } from '@cio/utils/functions/course-comment-mentions';
import { ZCourseCommentWrite, ZCreateCourseCommentThread } from '@cio/utils/validation/course-comment';
import { snackbar } from '$features/ui/snackbar/store';
import { BaseApiWithErrors, classroomio, hasErrorCode, type NormalizedApiError } from '$lib/utils/services/api';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import type {
  CourseCommentDraftAnchor,
  CourseCommentSummary,
  CourseCommentTeamMember,
  CourseCommentThread,
  CreateCourseCommentThreadRequest,
  DeleteCourseCommentRequest,
  EditCourseCommentRequest,
  GetCourseCommentSummaryRequest,
  GetCourseCommentTeamRequest,
  GetCourseCommentThreadRequest,
  ListCourseCommentsRequest,
  MarkAllCourseCommentsReadRequest,
  MarkCourseCommentThreadReadRequest,
  ReopenCourseCommentThreadRequest,
  ReplyCourseCommentRequest,
  ResolveCourseCommentThreadRequest
} from '../utils/types';

class CourseCommentsApi extends BaseApiWithErrors {
  courseId = $state<string | null>(null);
  enabled = $state(true);
  threads = $state<CourseCommentThread[] | null>(null);
  summary = $state<CourseCommentSummary | null>(null);
  team = $state<CourseCommentTeamMember[]>([]);
  isPosting = $state(false);
  resolvedLoaded = $state(false);
  isLoadingResolved = $state(false);

  private handleError(error: NormalizedApiError, snackbarKey: string) {
    if (hasErrorCode(error, ErrorCodes.COURSE_COMMENTS_DISABLED)) {
      this.enabled = false;
      return;
    }

    snackbar.error(snackbarKey);
  }

  private isCurrentCourse(courseId: string): boolean {
    return this.courseId === courseId;
  }

  private upsertThread(thread: CourseCommentThread) {
    if (!this.threads) {
      this.threads = [thread];
      return;
    }

    const index = this.threads.findIndex((existing) => existing.id === thread.id);
    if (index === -1) {
      this.threads.push(thread);
      return;
    }

    this.threads[index] = thread;
  }

  private removeThread(threadId: string) {
    if (!this.threads) return;

    const index = this.threads.findIndex((thread) => thread.id === threadId);
    if (index !== -1) this.threads.splice(index, 1);
  }

  private parseWrite(markup: string) {
    const result = ZCourseCommentWrite.safeParse(fromMentionMarkup(markup));
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return null;
    }

    return result.data;
  }

  /** Whether comments are loaded for this course, which only happens for its team. */
  isReadyFor(courseId: string | undefined): boolean {
    return Boolean(courseId) && this.courseId === courseId && this.enabled;
  }

  getThread(threadId: string): CourseCommentThread | undefined {
    return this.threads?.find((thread) => thread.id === threadId);
  }

  /** Loads open threads, counts and the mention list for a course. Resolved threads load on demand. */
  async load(courseId: string) {
    if (this.courseId !== courseId) this.clear();

    this.courseId = courseId;
    this.enabled = true;
    await Promise.all([this.loadOpenThreads(courseId), this.refreshSummary(), this.loadTeam(courseId)]);
  }

  private async loadOpenThreads(courseId: string) {
    await this.execute<ListCourseCommentsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].comments.$get({ param: { courseId }, query: { status: 'open' } }),
      logContext: 'loading course comments',
      onSuccess: (response) => {
        if (!this.isCurrentCourse(courseId)) return;

        const resolved = this.threads?.filter((thread) => thread.status === 'resolved') ?? [];
        this.threads = [...response.data, ...resolved];
      },
      onError: (error) => this.handleError(error, 'course_comments.snackbar.load_failed')
    });
  }

  private async loadTeam(courseId: string) {
    await this.execute<GetCourseCommentTeamRequest>({
      requestFn: () => classroomio.course[':courseId'].comments.team.$get({ param: { courseId } }),
      logContext: 'loading course comment team',
      onSuccess: (response) => {
        if (this.isCurrentCourse(courseId)) this.team = response.data;
      },
      onError: (error) => this.handleError(error, 'course_comments.snackbar.load_failed')
    });
  }

  async loadResolved() {
    const courseId = this.courseId;
    if (!courseId || this.resolvedLoaded || this.isLoadingResolved) return;

    this.isLoadingResolved = true;
    await this.execute<ListCourseCommentsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].comments.$get({ param: { courseId }, query: { status: 'resolved' } }),
      logContext: 'loading resolved course comments',
      onSuccess: (response) => {
        if (!this.isCurrentCourse(courseId)) return;

        for (const thread of response.data) this.upsertThread(thread);
        this.resolvedLoaded = true;
      },
      onError: (error) => this.handleError(error, 'course_comments.snackbar.load_failed')
    });
    this.isLoadingResolved = false;
  }

  async refreshSummary() {
    const courseId = this.courseId;
    if (!courseId) return;

    await this.execute<GetCourseCommentSummaryRequest>({
      requestFn: () => classroomio.course[':courseId'].comments.summary.$get({ param: { courseId } }),
      logContext: 'loading course comment counts',
      onSuccess: (response) => {
        if (this.isCurrentCourse(courseId)) this.summary = response.data;
      },
      onError: (error) => {
        if (hasErrorCode(error, ErrorCodes.COURSE_COMMENTS_DISABLED)) this.enabled = false;
      }
    });
  }

  /** Refetches one thread, for example after a live event or to open a resolved one from a link. */
  async refreshThread(threadId: string): Promise<CourseCommentThread | null> {
    const courseId = this.courseId;
    if (!courseId) return null;

    let loaded: CourseCommentThread | null = null;
    await this.execute<GetCourseCommentThreadRequest>({
      requestFn: () => classroomio.course[':courseId'].comments[':threadId'].$get({ param: { courseId, threadId } }),
      logContext: 'loading a course comment thread',
      onSuccess: (response) => {
        if (!this.isCurrentCourse(courseId)) return;

        loaded = response.data;
        this.upsertThread(response.data);
      },
      onError: (error) => {
        if (hasErrorCode(error, ErrorCodes.COURSE_COMMENT_THREAD_NOT_FOUND)) {
          this.removeThread(threadId);
          return;
        }
        if (hasErrorCode(error, ErrorCodes.COURSE_COMMENTS_DISABLED)) this.enabled = false;
      }
    });

    return loaded;
  }

  async createThread(anchor: CourseCommentDraftAnchor, markup: string): Promise<CourseCommentThread | null> {
    const courseId = this.courseId;
    if (!courseId) return null;

    const result = ZCreateCourseCommentThread.safeParse({ ...fromMentionMarkup(markup), anchor });
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return null;
    }

    let created: CourseCommentThread | null = null;
    this.isPosting = true;
    await this.execute<CreateCourseCommentThreadRequest>({
      requestFn: () => classroomio.course[':courseId'].comments.$post({ param: { courseId }, json: result.data }),
      logContext: 'creating a course comment',
      onSuccess: (response) => {
        created = response.data;
        this.upsertThread(response.data);
      },
      onError: (error) => this.handleError(error, 'course_comments.snackbar.post_failed')
    });
    this.isPosting = false;
    if (created) void this.refreshSummary();

    return created;
  }

  async reply(threadId: string, markup: string): Promise<boolean> {
    const courseId = this.courseId;
    const data = this.parseWrite(markup);
    if (!courseId || !data) return false;

    this.isPosting = true;
    const response = await this.execute<ReplyCourseCommentRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].comments[':threadId'].comments.$post({
          param: { courseId, threadId },
          json: data
        }),
      logContext: 'replying to a course comment',
      onSuccess: (result) => this.upsertThread(result.data),
      onError: (error) => this.handleError(error, 'course_comments.snackbar.post_failed')
    });
    this.isPosting = false;
    if (response) void this.refreshSummary();

    return Boolean(response);
  }

  async edit(threadId: string, commentId: string, markup: string): Promise<boolean> {
    const courseId = this.courseId;
    const data = this.parseWrite(markup);
    if (!courseId || !data) return false;

    this.isPosting = true;
    const response = await this.execute<EditCourseCommentRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].comments[':threadId'].comments[':commentId'].$patch({
          param: { courseId, threadId, commentId },
          json: data
        }),
      logContext: 'editing a course comment',
      onSuccess: (result) => this.upsertThread(result.data),
      onError: (error) => this.handleError(error, 'course_comments.snackbar.edit_failed')
    });
    this.isPosting = false;

    return Boolean(response);
  }

  async remove(threadId: string, commentId: string): Promise<boolean> {
    const courseId = this.courseId;
    if (!courseId) return false;

    const response = await this.execute<DeleteCourseCommentRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].comments[':threadId'].comments[':commentId'].$delete({
          param: { courseId, threadId, commentId }
        }),
      logContext: 'deleting a course comment',
      onSuccess: async (result) => {
        if (result.data.threadDeleted) {
          this.removeThread(threadId);
          return;
        }

        await this.refreshThread(threadId);
      },
      onError: (error) => this.handleError(error, 'course_comments.snackbar.delete_failed')
    });
    if (response) void this.refreshSummary();

    return Boolean(response);
  }

  async resolve(threadId: string) {
    await this.setStatus(threadId, 'resolved');
  }

  async reopen(threadId: string) {
    await this.setStatus(threadId, 'open');
  }

  private async setStatus(threadId: string, status: CourseCommentThread['status']) {
    const courseId = this.courseId;
    const thread = this.getThread(threadId);
    if (!courseId || !thread) return;

    const previous = thread.status;
    thread.status = status;

    const routes = classroomio.course[':courseId'].comments[':threadId'];
    const response =
      status === 'resolved'
        ? await this.execute<ResolveCourseCommentThreadRequest>({
            requestFn: () => routes.resolve.$post({ param: { courseId, threadId } }),
            logContext: 'resolving a course comment thread',
            onSuccess: (result) => this.upsertThread(result.data),
            onError: (error) => this.handleError(error, 'course_comments.snackbar.resolve_failed')
          })
        : await this.execute<ReopenCourseCommentThreadRequest>({
            requestFn: () => routes.reopen.$post({ param: { courseId, threadId } }),
            logContext: 'reopening a course comment thread',
            onSuccess: (result) => this.upsertThread(result.data),
            onError: (error) => this.handleError(error, 'course_comments.snackbar.reopen_failed')
          });

    if (!response) {
      const current = this.getThread(threadId);
      if (current) current.status = previous;
      return;
    }

    void this.refreshSummary();
  }

  async markRead(threadId: string) {
    const courseId = this.courseId;
    const thread = this.getThread(threadId);
    if (!courseId || !thread || thread.unreadCount === 0) return;

    const previousUnread = thread.unreadCount;
    thread.unreadCount = 0;

    const response = await this.execute<MarkCourseCommentThreadReadRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].comments[':threadId'].read.$post({ param: { courseId, threadId } }),
      logContext: 'marking a course comment thread read'
    });

    if (!response) {
      const current = this.getThread(threadId);
      if (current) current.unreadCount = previousUnread;
      return;
    }

    void this.refreshSummary();
  }

  async markAllRead() {
    const courseId = this.courseId;
    if (!courseId) return;

    const previous = new Map((this.threads ?? []).map((thread) => [thread.id, thread.unreadCount]));
    for (const thread of this.threads ?? []) thread.unreadCount = 0;

    const response = await this.execute<MarkAllCourseCommentsReadRequest>({
      requestFn: () => classroomio.course[':courseId'].comments['read-all'].$post({ param: { courseId } }),
      logContext: 'marking all course comments read',
      onError: () => snackbar.error('course_comments.snackbar.mark_read_failed')
    });

    if (!response) {
      for (const thread of this.threads ?? []) thread.unreadCount = previous.get(thread.id) ?? thread.unreadCount;
      return;
    }

    void this.refreshSummary();
  }

  clear() {
    this.courseId = null;
    this.threads = null;
    this.summary = null;
    this.team = [];
    this.resolvedLoaded = false;
    this.isLoadingResolved = false;
    this.enabled = true;
    this.resetErrors();
  }
}

export const courseCommentsApi = new CourseCommentsApi();
