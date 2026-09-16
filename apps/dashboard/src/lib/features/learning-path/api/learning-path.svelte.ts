import { BaseApiWithErrors } from '$lib/utils/services/api';
import type {
  CreateLearningPathInput,
  LearningPathCourseItem,
  LearningPathDetail,
  UpdateLearningPathInput
} from '../utils/types';
import { MOCK_PATHS } from '../utils/mock-data';
import { orgNavCountsApi } from '$features/ui/sidebar/org-sidebar/org-nav-counts.svelte';
import { coursesApi } from '$features/course/api';
import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';
import { isPathAccessibleToUser } from '../utils/learning-path-utils';

function getStorageKey(orgId?: string | null): string {
  return orgId ? `classroomio_learning_paths_state_${orgId}` : 'classroomio_learning_paths_state';
}

function loadStoredPaths(orgId?: string | null): LearningPathDetail[] {
  if (typeof window === 'undefined') return [...MOCK_PATHS];

  try {
    const raw = sessionStorage.getItem(getStorageKey(orgId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((pathItem) => {
          if (pathItem.tutorIds === undefined) {
            const matchingMock = MOCK_PATHS.find((mockItem) => mockItem.id === pathItem.id);
            if (matchingMock && matchingMock.tutorIds) {
              return { ...pathItem, tutorIds: matchingMock.tutorIds };
            }
          }
          return pathItem;
        });
      }
    }
  } catch {
    // Ignore JSON errors
  }
  return [...MOCK_PATHS];
}

function saveStoredPaths(paths: LearningPathDetail[], orgId?: string | null): boolean {
  if (typeof window === 'undefined') return false;

  try {
    sessionStorage.setItem(getStorageKey(orgId), JSON.stringify(paths));
    return true;
  } catch (error) {
    console.error('Failed to save learning paths to sessionStorage', error);
    return false;
  }
}

export class LearningPathApi extends BaseApiWithErrors {
  paths = $state<LearningPathDetail[]>([]);
  currentPath = $state<LearningPathDetail | null>(null);
  currentOrgId = $state<string | null>(null);

  constructor() {
    super();
    this.paths = loadStoredPaths(this.currentOrgId);
    this.updateNavCount();
  }

  setOrg(orgId: string, initialPaths?: LearningPathDetail[]) {
    this.currentOrgId = orgId;
    const hasStoredState = typeof window !== 'undefined' && sessionStorage.getItem(getStorageKey(orgId)) !== null;
    if (hasStoredState) {
      this.paths = loadStoredPaths(orgId);
    } else if (initialPaths && initialPaths.length > 0) {
      this.paths = [...initialPaths];
      this.save();
    } else {
      this.paths = loadStoredPaths(orgId);
      this.save();
    }
    this.updateNavCount();
  }

  setPaths(paths: LearningPathDetail[], orgId?: string) {
    if (orgId) {
      this.currentOrgId = orgId;
    }
    this.paths = [...paths];
    this.save();
  }

  updateNavCount(count?: number) {
    const effectiveCount = count !== undefined ? count : this.paths.length;
    orgNavCountsApi.setCount('learningPaths', effectiveCount);
  }

  private save(): boolean {
    const success = saveStoredPaths(this.paths, this.currentOrgId);
    this.updateNavCount();
    return success;
  }

  async listPaths(): Promise<void> {
    if (this.paths.length === 0) {
      this.paths = loadStoredPaths(this.currentOrgId);
    }
    this.updateNavCount();
  }

  async getPath(
    pathId: string,
    access?: { isAdmin?: boolean | null; userProfileId?: string | null }
  ): Promise<LearningPathDetail | null> {
    if (this.paths.length === 0) {
      this.paths = loadStoredPaths(this.currentOrgId);
    }
    const found = this.paths.find((p) => p.id === pathId || p.slug === pathId);
    if (found) {
      if (access && access.isAdmin !== undefined && access.isAdmin !== null) {
        const isAccessible = isPathAccessibleToUser(found, access.isAdmin, access.userProfileId);
        if (!isAccessible) {
          this.currentPath = null;
          return null;
        }
      }
      this.currentPath = found;
      return this.currentPath;
    }
    return null;
  }

  async createPath(data: CreateLearningPathInput): Promise<string> {
    const id = `lp-${Date.now()}`;
    const organizationId = data.organizationId || this.currentOrgId || 'org-1';
    const newPath: LearningPathDetail = {
      id,
      organizationId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      coverImage: null,
      isPublished: false,
      difficulty: 'BEGINNER',
      estimatedDurationMinutes: 0,
      cost: 0,
      currency: 'USD',
      showSavings: true,
      sequentialUnlock: true,
      selfEnrollment: true,
      autoEnroll: true,
      certificateEnabled: true,
      certificateTitle: `${data.name} Certificate`,
      certificateIssuer: 'Organization',
      courseOrderSetAt: null,
      courseCount: 0,
      memberCount: 0,
      completionsCount: 0,
      completionRate: 0,
      gradient: 'linear-gradient(135deg, oklch(0.666 0.179 58.318), oklch(0.769 0.188 70.08))',
      courses: [],
      tutorIds: [],
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.paths = [newPath, ...this.paths];
    this.currentPath = newPath;
    this.save();
    return id;
  }

  async updatePath(pathId: string, data: UpdateLearningPathInput): Promise<void> {
    const idx = this.paths.findIndex((p) => p.id === pathId || p.slug === pathId);
    if (idx !== -1) {
      const target = this.paths[idx];
      const updated: LearningPathDetail = {
        ...target,
        ...data,
        updatedAt: new Date().toISOString()
      };
      this.paths[idx] = updated;
      this.paths = [...this.paths];
      if (this.currentPath && (this.currentPath.id === pathId || this.currentPath.slug === pathId)) {
        this.currentPath = updated;
      }
      this.save();
    }
  }

  async deletePath(pathId: string): Promise<void> {
    this.paths = this.paths.filter((p) => p.id !== pathId && p.slug !== pathId);
    if (this.currentPath?.id === pathId || this.currentPath?.slug === pathId) {
      this.currentPath = null;
    }
    this.save();
  }

  async addCourses(pathId: string, courseIds: string[]): Promise<boolean> {
    if (courseIds.length === 0) {
      return false;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const target = this.paths.find((p) => p.id === pathId || p.slug === pathId);
      if (!target) {
        this.error = 'Learning path not found';
        return false;
      }

      const existingIds = new Set((target.courses || []).map((c) => c.courseId));

      const newItems = courseIds
        .filter((cid) => !existingIds.has(cid))
        .map((cid, index) => {
          const orgCourse = coursesApi.orgCourses.find((ac) => ac.id === cid);
          const order = (target.courses || []).length + index + 1;
          const title = orgCourse?.title || 'Untitled Course';
          const description = orgCourse?.description || 'Description';
          const lessonsCount = orgCourse?.lessonCount ?? 0;
          const exercisesCount = (orgCourse as { exerciseCount?: number })?.exerciseCount ?? 0;
          const cost = orgCourse?.cost ?? 0;
          const currency = orgCourse?.currency || 'USD';
          const coverImage = orgCourse?.logo || null;

          return {
            id: `lpc-${Date.now()}-${index}`,
            courseId: cid,
            order,
            title,
            description,
            lessonsCount,
            exercisesCount,
            cost,
            currency,
            coverImage
          };
        });

      const updatedCourses = [...(target.courses || []), ...newItems];
      target.courses = updatedCourses;
      target.courseCount = updatedCourses.length;
      target.updatedAt = new Date().toISOString();

      this.paths = [...this.paths];
      if (this.currentPath && (this.currentPath.id === pathId || this.currentPath.slug === pathId)) {
        this.currentPath = target;
      }
      this.save();

      const successMessage =
        courseIds.length === 1
          ? t.get('cohorts.course_added') || 'Course added'
          : t.get('cohorts.multiple_added') || 'Courses added';

      snackbar.success(successMessage);
      return true;
    } catch (error) {
      console.error('Error in addCoursesToPath:', error);
      this.error = error instanceof Error ? error.message : 'Failed to add courses to path';
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Adds pre-constructed course items to a learning path, assigning fresh IDs and order.
   * Typically used during path cloning to duplicate courses without requiring the org course catalog to be loaded.
   *
   * This is a temporary function till API integration is done for learning paths
   *
   * @param pathId The target learning path ID or slug.
   * @param items The course items to append.
   * @returns True if items were successfully added; false otherwise.
   */
  async addCourseItems(pathId: string, items: LearningPathCourseItem[]): Promise<boolean> {
    if (!items || items.length === 0) {
      return false;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const target = this.paths.find((p) => p.id === pathId || p.slug === pathId);
      if (!target) {
        this.error = 'Learning path not found';
        return false;
      }

      const existingIds = new Set((target.courses || []).map((c) => c.courseId));
      const newItems: LearningPathCourseItem[] = items
        .filter((item) => !existingIds.has(item.courseId))
        .map((item, index) => ({
          ...item,
          id: `lpc-${Date.now()}-${index}`,
          order: (target.courses || []).length + index + 1
        }));

      const updatedCourses = [...(target.courses || []), ...newItems];
      target.courses = updatedCourses;
      target.courseCount = updatedCourses.length;
      target.updatedAt = new Date().toISOString();

      this.paths = [...this.paths];
      if (this.currentPath && (this.currentPath.id === pathId || this.currentPath.slug === pathId)) {
        this.currentPath = target;
      }
      this.save();
      return true;
    } catch (error) {
      console.error('Error in addCourseItems:', error);
      this.error = error instanceof Error ? error.message : 'Failed to add courses to path';
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  async removeCourse(pathId: string, courseId: string): Promise<void> {
    const target = this.paths.find((p) => p.id === pathId || p.slug === pathId);
    if (!target || !target.courses) return;

    const remaining = target.courses
      .filter((c) => c.id !== courseId && c.courseId !== courseId)
      .map((c, index) => ({ ...c, order: index + 1 }));

    target.courses = remaining;
    target.courseCount = remaining.length;
    target.updatedAt = new Date().toISOString();

    this.paths = [...this.paths];
    if (this.currentPath && (this.currentPath.id === pathId || this.currentPath.slug === pathId)) {
      this.currentPath = target;
    }
    this.save();
  }

  async reorderCourses(pathId: string, orderedCourseIds: string[]): Promise<void> {
    const target = this.paths.find((p) => p.id === pathId || p.slug === pathId);
    if (!target || !target.courses) return;

    const courseMap = new Map(target.courses.map((c) => [c.id, c]));
    const reordered = orderedCourseIds
      .map((id, index) => {
        const item = courseMap.get(id);
        if (!item) return null;
        return {
          ...item,
          order: index + 1
        };
      })
      .filter(Boolean) as typeof target.courses;

    target.courses = reordered;
    target.courseOrderSetAt = new Date().toISOString();
    target.updatedAt = new Date().toISOString();

    this.paths = [...this.paths];
    if (this.currentPath && (this.currentPath.id === pathId || this.currentPath.slug === pathId)) {
      this.currentPath = target;
    }
    this.save();
  }
}

export const learningPathApi = new LearningPathApi();
