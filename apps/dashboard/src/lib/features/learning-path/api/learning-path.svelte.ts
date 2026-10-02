import { ApiError, BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { ErrorCodes } from '@cio/utils/constants';
import type {
  CreateLearningPathData,
  CreateLearningPathInput,
  CreateLearningPathRequest,
  DeleteLearningPathRequest,
  GetLearningPathDetailRequest,
  LearningPathDetail,
  LearningPathSummary,
  LearningPathsPagination,
  ListLearningPathsRequest,
  PathListFilters,
  UpdateLearningPathData,
  UpdateLearningPathRequest
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
import { toPathListApiQuery } from '../utils/path-list-filters';

/** Staff workspace API: every request hits team-only endpoints (org admin or assigned tutor). Learner data lives in pathJourneyApi. */
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
  isForbidden = $state(false);
  loadError = $state<string | null>(null);
  isLoadingMorePaths = $state(false);

  /**
   * True while another server page exists (`page < totalPages`).
   */
  get hasMorePaths(): boolean {
    const pagination = this.pathsPagination;
    if (!pagination) return false;

    return pagination.page < pagination.totalPages;
  }

  /**
   * Ensures the staff detail for a path is loaded. Resolves to three outcomes
   * the route renders directly: `isNotFound` for a 404, `isForbidden` for a
   * 403 (not-permitted dialog), and `loadError` for any other failure.
   */
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
    this.isForbidden = false;
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
        this.isForbidden = false;
        this.loadError = null;
      } else {
        this.currentPath = null;
        this.isNotFound = true;
        this.isForbidden = false;
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
      this.isForbidden = status === 403;
      this.loadError =
        this.isNotFound || this.isForbidden
          ? null
          : error instanceof Error
            ? error.message
            : 'Failed to load learning path';

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

  /**
   * Seeds the listing store from server `load` data. Replaces the list, so each
   * navigation or invalidation starts from the server's page 1.
   */
  setPathList(paths: LearningPathSummary[], pagination: LearningPathsPagination | null) {
    this.listPathsRequestSeq += 1;
    this.paths = Array.isArray(paths) ? [...paths] : [];
    this.pathsPagination = pagination;
  }

  /**
   * Lists one server page of learning paths for the URL-driven listing.
   * Page 1 replaces the list; later pages append, skipping ids already present.
   */
  async listPaths(organizationId?: string, filters?: PathListFilters, page = 1): Promise<void> {
    const orgId = organizationId || get(currentOrg).id;
    if (!orgId || !filters) return;

    this.listedOrgId = orgId;
    const seq = ++this.listPathsRequestSeq;
    const query = toPathListApiQuery(orgId, filters, page);

    await this.execute<ListLearningPathsRequest>({
      requestFn: () =>
        classroomio['learning-path'].$get({
          query
        }),
      logContext: 'listing learning paths',
      onSuccess: (result) => {
        if (this.listedOrgId !== orgId || seq !== this.listPathsRequestSeq) return;

        const incoming = Array.isArray(result.data) ? result.data : [];
        if (page <= 1) {
          this.paths = incoming;
        } else {
          const seen = new Set(this.paths.map((p) => p.id));
          this.paths = [...this.paths, ...incoming.filter((p) => !seen.has(p.id))];
        }
        this.pathsPagination = result.pagination ?? null;
      }
    });
  }

  /**
   * Appends the next server page to the listing, for the "Load more" button.
   */
  async loadMorePaths(organizationId?: string, filters?: PathListFilters): Promise<void> {
    const orgId = organizationId || get(currentOrg).id;
    if (!orgId || !filters || this.isLoadingMorePaths) return;

    const nextPage = (this.pathsPagination?.page ?? 0) + 1;
    this.isLoadingMorePaths = true;

    try {
      await this.listPaths(orgId, filters, nextPage);
    } finally {
      this.isLoadingMorePaths = false;
    }
  }

  async get(pathId: string): Promise<LearningPathDetail | null> {
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
        // Preserve the access signals: execute swallows HTTP status, so map
        // the shared error codes back here. ensurePath relies on them to
        // render not-found vs not-permitted instead of a generic load error.
        if (code === ErrorCodes.LEARNING_PATH_NOT_FOUND) {
          requestError = new ApiError(message, 404);
        } else if (code === ErrorCodes.UNAUTHORIZED || code === ErrorCodes.FORBIDDEN) {
          requestError = new ApiError(message, 403);
        } else {
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

    if (this.pathsPagination) {
      this.pathsPagination = {
        ...this.pathsPagination,
        total: Math.max(0, this.pathsPagination.total - 1)
      };
    }
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

export const learningPathApi = new LearningPathApi();
