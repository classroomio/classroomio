import { ApiError, BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { ErrorCodes } from '@cio/utils/constants';
import type {
  CreateLearningPathData,
  CreateLearningPathInput,
  CreateLearningPathRequest,
  DeleteLearningPathRequest,
  GetLearningPathDetailRequest,
  LearningPathAccessOptions,
  LearningPathCourseProgress,
  LearningPathDetail,
  LearningPathWithEnrollment,
  LearningPathSummary,
  LearningPathsPagination,
  ListLearningPathsRequest,
  UpdateLearningPathData,
  UpdateLearningPathRequest
} from '../utils/types';
import type { CourseInPathContext, CourseInPathNode } from '../components/types';
import {
  MOCK_LEARNER_PATHS,
  getMockPathsForUser,
  getMockPathById,
  getCourseProgressList,
  findCourseInEnrolledMockPath
} from '../utils/mock-data';
import {
  ZCreateLearningPath,
  ZUpdateLearningPath,
  type TUpdateLearningPath
} from '@cio/utils/validation/learning-path';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { orgNavCountsApi } from '$features/ui/sidebar/org-sidebar/org-nav-counts.svelte';
import { currentOrg } from '$lib/utils/store/org';
import { get } from 'svelte/store';
import { snackbar } from '$features/ui/snackbar/store';

export class LearningPathApi extends BaseApiWithErrors {
  paths = $state<LearningPathSummary[]>([]);
  pathsPagination = $state<LearningPathsPagination | null>(null);
  currentPath = $state<LearningPathDetail | null>(null);

  private loadedPathId = $state<string | null>(null);
  private isPathDirty = $state(false);
  private inFlightPathRequests = new Map<string, Promise<LearningPathDetail | null>>();
  private pathRequestSeq = 0;
  private listedOrgId: string | null = null;
  private listPathsRequestSeq = 0;
  isNotFound = $state(false);
  loadError = $state<string | null>(null);

  async ensurePath(pathId: string): Promise<LearningPathDetail | null> {
    if (!pathId) return null;

    if (
      !this.isPathDirty &&
      (this.loadedPathId === pathId || this.currentPath?.publicId === pathId || this.currentPath?.id === pathId) &&
      this.currentPath
    ) {
      return this.currentPath;
    }

    const navSeq = ++this.pathRequestSeq;
    this.isNotFound = false;
    this.loadError = null;

    let fetchPromise = !this.isPathDirty ? this.inFlightPathRequests.get(pathId) : undefined;
    if (!fetchPromise) {
      fetchPromise = this.get(pathId);
      this.inFlightPathRequests.set(pathId, fetchPromise);
    }

    try {
      const detail = await fetchPromise;

      // Only the latest navigation may write shared state; earlier
      // requests resolve for their caller but leave currentPath alone.
      if (this.pathRequestSeq !== navSeq) {
        return detail;
      }

      if (detail) {
        this.currentPath = detail;
        this.loadedPathId = pathId;
        this.isPathDirty = false;
        this.isNotFound = false;
        this.loadError = null;
      } else {
        this.currentPath = null;
        this.isNotFound = true;
        this.loadError = null;
      }

      return detail;
    } catch (error) {
      if (this.pathRequestSeq !== navSeq) {
        return null;
      }

      this.currentPath = null;
      const status = error instanceof ApiError ? error.status : undefined;
      this.isNotFound = status === 404;
      this.loadError = this.isNotFound ? null : error instanceof Error ? error.message : 'Failed to load learning path';

      return null;
    } finally {
      if (this.inFlightPathRequests.get(pathId) === fetchPromise) {
        this.inFlightPathRequests.delete(pathId);
      }
    }
  }

  invalidatePath(pathId?: string) {
    if (
      !pathId ||
      this.loadedPathId === pathId ||
      this.currentPath?.id === pathId ||
      this.currentPath?.publicId === pathId
    ) {
      this.isPathDirty = true;
    }
  }

  async refreshPath(pathId: string) {
    this.invalidatePath(pathId);
    return this.ensurePath(pathId);
  }

  async listPaths(
    organizationId?: string,
    options: { page?: number; limit?: number; search?: string } = {}
  ): Promise<void> {
    const orgId = organizationId || get(currentOrg).id;
    if (!orgId) return;

    // The listing page filters client-side, so fetch up to a full page of 100.
    const { page = 1, limit = 100, search } = options;
    this.listedOrgId = orgId;
    const seq = ++this.listPathsRequestSeq;

    await this.execute<ListLearningPathsRequest>({
      requestFn: () =>
        classroomio['learning-path'].$get({
          query: { organizationId: orgId, page: String(page), limit: String(limit), search }
        }),
      logContext: 'listing learning paths',
      onSuccess: (result) => {
        if (this.listedOrgId === orgId && seq === this.listPathsRequestSeq) {
          this.paths = Array.isArray(result.data) ? result.data : [];
          this.pathsPagination = result.pagination ?? null;
        }
      }
    });
  }

  async get(pathId: string, _access?: LearningPathAccessOptions): Promise<LearningPathDetail | null> {
    let requestError: Error | null = null;
    let fetchedDetail: LearningPathDetail | null = null;

    await this.execute<GetLearningPathDetailRequest>({
      requestFn: () => classroomio['learning-path'][':pathId'].$get({ param: { pathId } }),
      logContext: 'getting learning path detail',
      onSuccess: (result) => {
        fetchedDetail = result.data;
        this.paths = this.paths.map((p) =>
          p.id === result.data.id || p.publicId === result.data.publicId ? { ...p, ...result.data } : p
        );
      },
      onError: (err) => {
        const message =
          typeof err === 'string'
            ? err
            : err && typeof err === 'object' && 'error' in err
              ? String((err as { error: unknown }).error)
              : 'Failed to load learning path';
        const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : null;
        // Preserve the not-found signal: execute swallows HTTP status, so map
        // the shared error code back to 404 here. ensurePath relies on it to
        // render the not-found state instead of a generic load error.
        requestError = code === ErrorCodes.LEARNING_PATH_NOT_FOUND ? new ApiError(message, 404) : new Error(message);
      }
    });

    if (requestError) {
      throw requestError;
    }

    return fetchedDetail;
  }

  async create(data: CreateLearningPathInput): Promise<CreateLearningPathData | undefined> {
    const orgId = data.organizationId || get(currentOrg).id;
    if (!orgId) {
      throw new Error('No organization selected');
    }

    const validationResult = ZCreateLearningPath.safeParse({
      name: data.name,
      description: data.description,
      organizationId: orgId
    });

    if (!validationResult.success) {
      this.errors = mapZodErrorsToTranslations(validationResult.error);
      return undefined;
    }

    const res = await this.execute<CreateLearningPathRequest>({
      requestFn: () =>
        classroomio['learning-path'].$post({
          json: {
            name: data.name,
            description: data.description,
            organizationId: orgId
          }
        }),
      logContext: 'creating learning path',
      onSuccess: () => {
        orgNavCountsApi.adjustCount('learningPaths', 1);
        snackbar.success('learningPath.snackbar.created');
      }
    });

    return res?.data;
  }

  removePathFromLists(pathId: string) {
    this.paths = this.paths.filter((p) => p.id !== pathId && p.publicId !== pathId);
  }

  async update(
    pathId: string,
    data: TUpdateLearningPath,
    options: { showSuccessToast?: boolean } = {}
  ): Promise<UpdateLearningPathData | null> {
    const { showSuccessToast = true } = options;

    const validationResult = ZUpdateLearningPath.safeParse(data);
    if (!validationResult.success) {
      this.errors = mapZodErrorsToTranslations(validationResult.error);
      const firstError = this.errors.general ?? Object.values(this.errors).find(Boolean);
      if (firstError) {
        snackbar.error(firstError);
      }
      return null;
    }

    const res = await this.execute<UpdateLearningPathRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId'].$put({
          param: { pathId },
          json: validationResult.data
        }),
      logContext: 'updating learning path',
      onSuccess: (result) => {
        if (this.currentPath && (this.currentPath.id === pathId || this.currentPath.publicId === pathId)) {
          this.currentPath = { ...this.currentPath, ...result.data };
        }
        this.paths = this.paths.map((p) => (p.id === pathId || p.publicId === pathId ? { ...p, ...result.data } : p));
        if (showSuccessToast) {
          snackbar.success('learningPath.snackbar.updated');
        }
      }
    });

    return res?.data ?? null;
  }

  async delete(pathId: string): Promise<void> {
    await this.execute<DeleteLearningPathRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId'].$delete({
          param: { pathId }
        }),
      logContext: 'deleting learning path',
      onSuccess: () => {
        this.removePathFromLists(pathId);
        if (this.currentPath?.id === pathId || this.currentPath?.publicId === pathId) {
          this.currentPath = null;
        }
        this.invalidatePath(pathId);
        orgNavCountsApi.adjustCount('learningPaths', -1);
        snackbar.success('learningPath.snackbar.deleted');
      }
    });
  }
}

export const learningPathApi = /* @__PURE__ */ new LearningPathApi();

const sleep = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms));

class LearnerPathStore {
  // Learner-facing state
  enrolledPaths = $state<LearningPathWithEnrollment[]>([]);
  isLoading = $state(false);

  // Selected path for the detail page
  selectedPath = $state<LearningPathWithEnrollment | null>(null);

  // Derived learner helpers
  activePath = $derived.by(() => {
    const inProgress = this.enrolledPaths.filter((path) => path.enrollment?.state === 'IN_PROGRESS');

    return (
      inProgress.sort((a, b) => (b.enrollment?.progressPercent ?? 0) - (a.enrollment?.progressPercent ?? 0))[0] ?? null
    );
  });

  completedPaths = $derived(this.enrolledPaths.filter((path) => path.enrollment?.state === 'COMPLETED'));

  notStartedPaths = $derived(this.enrolledPaths.filter((path) => path.enrollment?.state === 'NOT_STARTED'));

  inProgressPaths = $derived(this.enrolledPaths.filter((path) => path.enrollment?.state === 'IN_PROGRESS'));

  hasLoaded = $state(false);

  explorePaths = $derived.by(() => {
    const enrolledIds = new Set(this.enrolledPaths.map((path) => path.id));

    return MOCK_LEARNER_PATHS.filter((path) => !enrolledIds.has(path.id))
      .map((path) => ({
        id: path.id,
        name: path.name,
        description: path.description,
        coverGradient: path.coverGradient,
        coverImage: path.coverImage,
        href: `/lms/paths/${path.id}`
      }))
      .slice(0, 3);
  });

  async listEnrolled(): Promise<void> {
    this.isLoading = true;
    try {
      await sleep(150);
      this.enrolledPaths = getMockPathsForUser();
    } finally {
      this.isLoading = false;
      this.hasLoaded = true;
    }
  }

  getPath(authPathId: string): LearningPathWithEnrollment | null {
    return this.enrolledPaths.find((path) => path.id === authPathId) ?? null;
  }

  getPathCourses(path: LearningPathWithEnrollment): LearningPathCourseProgress[] {
    return getCourseProgressList(path);
  }

  getCoursePathContext(courseId?: string, courseTitle?: string): CourseInPathContext | null {
    const match = findCourseInEnrolledMockPath(courseId, courseTitle);
    if (!match) {
      return null;
    }

    const { path, courseIndex } = match;
    const progress = getCourseProgressList(path);
    const nodes: CourseInPathNode[] = progress.map((course) => ({ title: course.title, state: course.state }));
    const nextCourse = progress.find((course) => course.courseIndex > courseIndex && course.state !== 'COMPLETED');

    return {
      pathName: path.name,
      pathHref: `/lms/paths/${path.id}`,
      nodes,
      currentPosition: courseIndex + 1,
      next: nextCourse
        ? {
            position: nextCourse.courseIndex + 1,
            title: nextCourse.title,
            remainingLessons: Math.max(0, nextCourse.lessonCount - nextCourse.lessonsCompleted),
            remainingExercises: Math.max(0, nextCourse.exerciseCount - nextCourse.exercisesCompleted)
          }
        : null,
      isPathComplete: progress.every((course) => course.state === 'COMPLETED')
    };
  }

  async ensureSelectedPath(pathId: string): Promise<void> {
    if (this.selectedPath?.id === pathId) {
      return;
    }

    this.isLoading = true;
    try {
      await sleep(120);
      this.selectedPath = getMockPathById(pathId);
    } finally {
      this.isLoading = false;
    }
  }
}

export const learnerPathStore = /* @__PURE__ */ new LearnerPathStore();
