import { ApiError, BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  AddPathCoursesRequest,
  CreateLearningPathData,
  CreateLearningPathInput,
  CreateLearningPathRequest,
  DeleteLearningPathRequest,
  GetLearningPathDetailRequest,
  LearningPathAccessOptions,
  LearningPathCourseItem,
  LearningPathDetail,
  LearningPathSummary,
  ListLearningPathsRequest,
  ReorderPathCoursesRequest,
  RemovePathCourseRequest,
  UpdateLearningPathData,
  UpdateLearningPathRequest,
  UpdatePathCourseRequest
} from '../utils/types';
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
  currentPath = $state<LearningPathDetail | null>(null);

  private loadedPathId = $state<string | null>(null);
  private isPathDirty = $state(false);
  private inFlightPathRequests = new Map<string, Promise<LearningPathDetail | null>>();
  private pathRequestSeq = 0;
  private activePathRequestSeq = 0;
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
    this.activePathRequestSeq = navSeq;
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
      if (this.activePathRequestSeq !== navSeq) {
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
      if (this.activePathRequestSeq !== navSeq) {
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

  async listPaths(organizationId?: string): Promise<void> {
    const orgId = organizationId || get(currentOrg).id;
    if (!orgId) return;

    await this.execute<ListLearningPathsRequest>({
      requestFn: () => classroomio['learning-path'].$get({ query: { organizationId: orgId } }),
      logContext: 'listing learning paths',
      onSuccess: (result) => {
        this.paths = result.data;
      }
    });
  }

  async get(pathId: string, _access?: LearningPathAccessOptions): Promise<LearningPathDetail | null> {
    let requestError: Error | null = null;
    let fetchedDetail: LearningPathDetail | null = null;

    await this.execute<GetLearningPathDetailRequest>({
      requestFn: async () => {
        const response = await classroomio['learning-path'][':pathId'].$get({ param: { pathId } });
        if (!response.ok) {
          const clone = response.clone();
          const body = (await clone.json().catch(() => null)) as {
            message?: string;
            error?: string;
            code?: string;
          } | null;
          const message = body?.error || body?.message || `HTTP ${response.status}: ${response.statusText}`;
          requestError = new ApiError(message, response.status, response.statusText, response);
        }
        return response;
      },
      logContext: 'getting learning path detail',
      onSuccess: (result) => {
        fetchedDetail = result.data;
        this.paths = this.paths.map((p) =>
          p.id === result.data.id || p.publicId === result.data.publicId ? { ...p, ...result.data } : p
        );
      },
      onError: (err) => {
        if (!requestError) {
          const message =
            typeof err === 'string'
              ? err
              : err && typeof err === 'object' && 'error' in err && typeof err.error === 'string'
                ? err.error
                : 'Failed to load learning path';
          requestError = new Error(message);
        }
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

  async addCourses(pathId: string, courseIds: string[]): Promise<boolean> {
    if (courseIds.length === 0) {
      return false;
    }

    const res = await this.execute<AddPathCoursesRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId']['courses'].$post({
          param: { pathId },
          json: { courseIds }
        }),
      logContext: 'adding courses to learning path',
      onSuccess: async () => {
        await this.refreshPath(pathId);
        snackbar.success(
          courseIds.length === 1 ? 'learningPath.snackbar.course_added' : 'learningPath.snackbar.courses_added'
        );
      }
    });

    return Boolean(res?.success);
  }

  async removeCourse(pathId: string, courseId: string): Promise<void> {
    await this.execute<RemovePathCourseRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId']['courses'][':courseId'].$delete({
          param: { pathId, courseId }
        }),
      logContext: 'removing course from learning path',
      onSuccess: () => {
        if (this.currentPath && (this.currentPath.id === pathId || this.currentPath.publicId === pathId)) {
          const remaining = this.currentPath.courses.filter((c) => c.courseId !== courseId && c.id !== courseId);
          this.currentPath.courses = remaining.map((c, idx) => ({ ...c, order: idx + 1 }));
        }
        this.paths = this.paths.map((p) => {
          if (p.id === pathId || p.publicId === pathId) {
            return { ...p, courseCount: Math.max(0, (p.courseCount || 1) - 1) };
          }
          return p;
        });
        snackbar.success('learningPath.snackbar.course_removed');
      }
    });
  }

  async reorderCourses(pathId: string, courseIds: string[]): Promise<void> {
    await this.execute<ReorderPathCoursesRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId']['courses']['order'].$put({
          param: { pathId },
          json: { courseIds }
        }),
      logContext: 'reordering courses in learning path',
      onSuccess: () => {
        if (this.currentPath && (this.currentPath.id === pathId || this.currentPath.publicId === pathId)) {
          const courseMap = new Map(this.currentPath.courses.map((c) => [c.courseId, c]));
          const reordered: LearningPathCourseItem[] = [];
          courseIds.forEach((cid, index) => {
            const match = courseMap.get(cid);
            if (match) {
              reordered.push({ ...match, order: index + 1 });
            }
          });
          this.currentPath.courses = reordered;
        }
        snackbar.success('learningPath.snackbar.reordered');
      }
    });
  }

  async updateCourseOutcomes(pathId: string, courseId: string, outcomes: string[]): Promise<void> {
    await this.execute<UpdatePathCourseRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId']['courses'][':courseId'].$put({
          param: { pathId, courseId },
          json: { outcomes }
        }),
      logContext: 'updating course outcomes in learning path',
      onSuccess: (result) => {
        if (
          result.data &&
          this.currentPath &&
          (this.currentPath.id === pathId || this.currentPath.publicId === pathId)
        ) {
          const index = this.currentPath.courses.findIndex((c) => c.courseId === courseId);
          if (index !== -1) {
            this.currentPath.courses[index].outcomes = result.data.outcomes;
          }
        }
      }
    });
  }
}

export const learningPathApi = new LearningPathApi();
