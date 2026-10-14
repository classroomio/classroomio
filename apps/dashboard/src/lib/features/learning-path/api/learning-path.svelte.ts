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
  EnrollInLearningPathRequest,
  ExplorePathItem,
  GetPublicLearningPathRequest,
  ListPublicLearningPathsRequest,
  LearningPathsPagination,
  ListLearningPathsRequest,
  PathListFilters,
  PublicLearningPathDetail,
  UpdateLearningPathData,
  UpdateLearningPathRequest,
  PublicLearningPathItem
} from '../utils/types';
import { enrolledApi } from '$features/lms/api/enrolled.svelte';
import type { EnrolledPath, GetPathJourneyRequest, PathJourney } from '$features/lms/utils/types';
import type { EarnedPathCertificate, GetEarnedCertificatesRequest } from '$features/lms/utils/types';
import type { CourseInPathContext, CourseInPathNode } from '../components/types';
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
import { slugifyForFilename } from '@cio/utils/functions';
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

export const learningPathApi = /* @__PURE__ */ new LearningPathApi();

function isNotPathMemberError(result: unknown): boolean {
  if (typeof result !== 'object' || result === null) return false;

  const body = result as { code?: unknown; error?: unknown };
  return (
    body.code === 'UNAUTHORIZED' &&
    typeof body.error === 'string' &&
    body.error.includes('member of this learning path')
  );
}

class LearnerPathStore extends BaseApiWithErrors {
  // Learner-facing state
  enrolledPaths = $state<EnrolledPath[]>([]);
  hasLoaded = $state(false);
  // Which org+profile the learner state was loaded for. Cleared on reset.
  private loadedScope: { orgId: string; profileId: string } | null = null;

  // Latest journey/detail request ids. Late responses from older requests are ignored.
  private journeyRequestSeq = 0;
  private publicDetailRequestSeq = 0;

  // Selected path journey for the detail page
  selectedJourney = $state<PathJourney | null>(null);
  // True once the in-flight selected-journey request finished (found or not).
  // Guards redirects that must only fire for definitively-unenrolled paths.
  selectedJourneyLoaded = $state(false);

  selectedJourneyForbidden = $state(false);

  // Explore strip rows, loaded on demand by the Explore page
  explorePaths = $state<ExplorePathItem[]>([]);

  // Full published catalog for the Explore page (page splits enrolled vs new)
  catalogPaths = $state<PublicLearningPathItem[]>([]);

  // Certificates the caller can download, for completed-path cards
  pathCertificates = $state<EarnedPathCertificate[]>([]);

  // Public detail (with courses) for the explore preview modal
  publicPathDetail = $state<PublicLearningPathDetail | null>(null);
  isLoadingPublicPathDetail = $state(false);

  // True while a certificate file is being generated for download
  isDownloadingCertificate = $state(false);

  // Journey cache keyed by path id and publicId
  private journeyCache = new Map<string, PathJourney>();

  // Path widget context for the open course (null when the course is in no enrolled path)
  pathContext = $state<CourseInPathContext | null>(null);

  // Derived learner helpers
  activePath = $derived.by(() => {
    const inProgress = this.enrolledPaths.filter((path) => !path.isComplete && path.progress > 0);
    const resumable = inProgress.sort((a, b) => b.progress - a.progress)[0];

    if (resumable) return resumable;

    // No path in progress: fall back to the most recently completed path so an
    // earned certificate stays one click away in the hero.
    const latestCompleted = this.enrolledPaths
      .filter((path) => path.isComplete)
      .sort((a, b) => +new Date(b.completedAt ?? 0) - +new Date(a.completedAt ?? 0))[0];

    return latestCompleted ?? null;
  });

  completedPaths = $derived(this.enrolledPaths.filter((path) => path.isComplete));

  notStartedPaths = $derived(this.enrolledPaths.filter((path) => !path.isComplete && path.progress <= 0));

  inProgressPaths = $derived(this.enrolledPaths.filter((path) => !path.isComplete && path.progress > 0));

  async listEnrolled(): Promise<void> {
    this.isLoading = true;
    try {
      // The enrolled feed mixes courses and paths: follow every page and keep
      // the paths, so older paths are not lost behind recent course activity.
      const collected: EnrolledPath[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        await enrolledApi.fetchEnrolled({ status: 'all', limit: 50, page });
        const items = enrolledApi.items;
        collected.push(...items.flatMap((item) => (item.kind === 'learning_path' ? [item.data] : [])));
        totalPages = enrolledApi.pagination?.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages);
      this.enrolledPaths = collected;
      this.hasLoaded = true;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Loads enrolled paths + certificates for an org+profile, resetting any
   * state from a previously-viewed org. Pages call this instead of checking
   * hasLoaded themselves, so org switches always refetch.
   */
  async ensureLoadedFor(orgId: string, profileId: string): Promise<void> {
    const scope = this.loadedScope;
    if (scope && scope.orgId === orgId && scope.profileId === profileId && this.hasLoaded) return;

    this.resetLearnerState();
    this.loadedScope = { orgId, profileId };
    await this.listEnrolled();
    await this.listCertificates();
  }

  /** Drops all learner state (org switch, logout). Callers reload on demand. */
  resetLearnerState(): void {
    this.enrolledPaths = [];
    this.hasLoaded = false;
    this.loadedScope = null;
    this.selectedJourney = null;
    this.selectedJourneyLoaded = false;
    this.selectedJourneyForbidden = false;
    this.explorePaths = [];
    this.catalogPaths = [];
    this.pathCertificates = [];
    this.publicPathDetail = null;
    this.pathContext = null;
    this.journeyCache.clear();
  }

  /** Drops cached journeys so lock/progress reads refetch after completions. */
  invalidateJourneyCache(): void {
    this.journeyCache.clear();
  }

  getPath(idOrPublicId: string): EnrolledPath | null {
    return this.enrolledPaths.find((path) => path.id === idOrPublicId || path.publicId === idOrPublicId) ?? null;
  }

  getPathStatus(path: EnrolledPath): 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' {
    if (path.isComplete) return 'COMPLETED';
    if (path.progress > 0) return 'IN_PROGRESS';

    return 'NOT_STARTED';
  }

  hasPathCertificate(pathId: string): boolean {
    return this.pathCertificates.some((certificate) => certificate.id === pathId);
  }

  async listCertificates(): Promise<void> {
    // The unified certificates feed mixes courses and paths: follow every
    // page and keep the paths, so the check works with many certificates.
    const collected: EarnedPathCertificate[] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const response = await this.execute<GetEarnedCertificatesRequest>({
        requestFn: () => classroomio.organization.certificates.$get({ query: { page: String(page), limit: '50' } }),
        logContext: 'loading path certificates'
      });
      const items = response?.data ?? [];
      collected.push(...items.flatMap((item) => (item.kind === 'learning_path' ? [item.data] : [])));
      totalPages = response?.pagination?.totalPages ?? 1;
      page += 1;
    } while (page <= totalPages);
    this.pathCertificates = collected;
  }

  async ensureSelectedPath(pathId: string): Promise<PathJourney | null> {
    if (!pathId) return null;

    const requestSeq = ++this.journeyRequestSeq;
    this.selectedJourneyLoaded = false;
    this.selectedJourneyForbidden = false;
    try {
      const journey = await this.fetchJourney(pathId, requestSeq);
      if (requestSeq !== this.journeyRequestSeq) return null;

      this.selectedJourney = journey;

      return journey;
    } finally {
      this.selectedJourneyLoaded = true;
    }
  }

  private async fetchJourney(pathId: string, requestSeq?: number): Promise<PathJourney | null> {
    const cached = this.journeyCache.get(pathId);
    if (cached) return cached;

    const response = await this.execute<GetPathJourneyRequest>({
      requestFn: () => classroomio['learning-path'][':pathId'].journey.$get({ param: { pathId } }),
      logContext: 'loading learning path journey',
      onError: (result) => {
        if (requestSeq !== undefined && requestSeq !== this.journeyRequestSeq) return;

        if (isNotPathMemberError(result)) {
          this.selectedJourneyForbidden = true;
        }
      }
    });
    const journey = response?.data ?? null;
    if (!journey) return null;

    this.journeyCache.set(journey.path.id, journey);
    if (journey.path.publicId) this.journeyCache.set(journey.path.publicId, journey);

    return journey;
  }

  /**
   * Resolves the path widget for an open course from real journey data.
   * Stays null when the course is in none of the student's enrolled paths
   * (plain courses render no widget). When the caller knows which path the
   * student came from (path-mirror URLs), that path wins over first match.
   */
  async loadPathContext(courseId: string, preferredPublicId?: string): Promise<void> {
    this.pathContext = null;
    if (!courseId) return;

    if (!this.hasLoaded) {
      try {
        await this.listEnrolled();
      } catch {
        return;
      }
    }

    const orderedPaths =
      preferredPublicId && this.enrolledPaths.some((path) => path.publicId === preferredPublicId)
        ? [...this.enrolledPaths].sort(
            (a, b) => Number(b.publicId === preferredPublicId) - Number(a.publicId === preferredPublicId)
          )
        : this.enrolledPaths;

    for (const path of orderedPaths) {
      let journey: PathJourney | null = null;
      try {
        journey = await this.fetchJourney(path.id);
      } catch {
        continue;
      }
      if (!journey) continue;

      const position = journey.courses.findIndex((course) => course.courseId === courseId);
      if (position < 0) continue;

      const current = journey.courses[position];
      const nodes: CourseInPathNode[] = journey.courses.map((course) => ({
        title: course.title,
        state: course.status
      }));
      const nextCourse = journey.courses
        .filter((course) => course.position > current.position && !course.isComplete)
        .sort((a, b) => a.position - b.position)[0];

      this.pathContext = {
        pathName: journey.path.name,
        pathHref: `/lms/paths/${journey.path.publicId ?? journey.path.id}`,
        nodes,
        currentPosition: current.position,
        next: nextCourse
          ? {
              position: nextCourse.position,
              title: nextCourse.title,
              remainingLessons: Math.max(0, nextCourse.lessonsTotal - nextCourse.lessonsCompleted),
              remainingExercises: Math.max(0, nextCourse.exercisesTotal - nextCourse.exercisesCompleted)
            }
          : null,
        isPathComplete: journey.isComplete
      };

      return;
    }
  }

  async loadExplorePaths(limit = 3): Promise<void> {
    const siteName = get(currentOrg)?.siteName;
    if (!siteName) return;

    const enrolledIds = new Set(this.enrolledPaths.flatMap((path) => [path.id, path.publicId]));
    const response = await this.execute<ListPublicLearningPathsRequest>({
      requestFn: () => classroomio.organization['learning-paths'].public.$get({ query: { siteName } }),
      logContext: 'loading paths to explore'
    });
    const rows = response?.data?.learningPaths ?? [];
    this.explorePaths = rows
      .filter((row) => !enrolledIds.has(row.id) && !enrolledIds.has(row.publicId))
      .slice(0, limit)
      .map((row) => ({
        id: row.publicId ?? row.id,
        name: row.name,
        description: row.description ?? '',
        coverImage: row.coverImage ?? undefined,
        courseCount: row.courseCount ?? 0,
        href: `/lms/paths/${row.publicId ?? row.id}`
      }));
  }

  async enroll(pathId: string): Promise<boolean> {
    let enrolled = false;
    await this.execute<EnrollInLearningPathRequest>({
      requestFn: () => classroomio['learning-path'][':pathId'].enroll.$post({ param: { pathId }, json: {} }),
      logContext: 'enrolling in learning path',
      onSuccess: () => {
        enrolled = true;
      }
    });
    if (enrolled) {
      await this.listEnrolled();
    }

    return enrolled;
  }

  async downloadCertificate(pathId: string, name: string, format: 'pdf' | 'png'): Promise<boolean> {
    if (!pathId || this.isDownloadingCertificate) return false;

    this.isDownloadingCertificate = true;
    try {
      const response =
        format === 'png'
          ? await classroomio['learning-path'][':pathId']['download']['certificate']['png'].$post({
              param: { pathId },
              json: {}
            })
          : await classroomio['learning-path'][':pathId']['download']['certificate'].$post({
              param: { pathId },
              json: {}
            });
      if (!response.ok) {
        throw new Error(`Certificate download failed: ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(new Blob([blob], { type: format === 'png' ? 'image/png' : 'application/pdf' }));
      const link = document.createElement('a');
      document.body.append(link);
      link.download = `certificate-${slugifyForFilename(name || 'learning-path')}.${format}`;
      link.href = url;
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error downloading learning path certificate:', error);
      snackbar.error('course.navItem.certificates.unexpected_error');

      return false;
    } finally {
      this.isDownloadingCertificate = false;
    }
  }

  async loadCatalogPaths(limit = 100): Promise<void> {
    const siteName = get(currentOrg)?.siteName;
    if (!siteName) return;

    const response = await this.execute<ListPublicLearningPathsRequest>({
      requestFn: () =>
        classroomio.organization['learning-paths'].public.$get({ query: { siteName, limit: String(limit) } }),
      logContext: 'loading path catalog'
    });
    this.catalogPaths = response?.data?.learningPaths ?? [];
  }

  async loadPublicPathDetail(slug: string): Promise<void> {
    const organizationId = get(currentOrg)?.id;
    this.publicPathDetail = null;
    if (!slug || !organizationId) return;

    const requestSeq = ++this.publicDetailRequestSeq;
    this.isLoadingPublicPathDetail = true;
    try {
      const response = await this.execute<GetPublicLearningPathRequest>({
        requestFn: () =>
          classroomio['learning-path'].public[':slug'].$get({ param: { slug }, query: { organizationId } }),
        logContext: 'loading public path detail'
      });
      if (requestSeq !== this.publicDetailRequestSeq) return;

      this.publicPathDetail = response?.data ?? null;
    } finally {
      this.isLoadingPublicPathDetail = false;
    }
  }

  clearPublicPathDetail(): void {
    this.publicDetailRequestSeq += 1;
    this.publicPathDetail = null;
  }
}

export const learnerPathStore = /* @__PURE__ */ new LearnerPathStore();
