import { BaseApiWithErrors } from '$lib/utils/services/api';
import type { LearningPathDetail } from '../utils/types';
import { slugify } from '../utils/learning-path-utils';
import { MOCK_PATHS } from '../utils/mock-data';
import { orgNavCountsApi } from '$features/ui/sidebar/org-sidebar/org-nav-counts.svelte';
import { coursesApi } from '$features/course/api';
import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';

const STORAGE_KEY = 'classroomio_learning_paths_state';

function loadStoredPaths(): LearningPathDetail[] {
  if (typeof window === 'undefined') return [...MOCK_PATHS];

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore JSON errors
  }
  return [...MOCK_PATHS];
}

function saveStoredPaths(paths: LearningPathDetail[]) {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(paths));
  } catch {
    // Ignore quota errors
  }
}

export class LearningPathApi extends BaseApiWithErrors {
  paths = $state<LearningPathDetail[]>([]);
  currentPath = $state<LearningPathDetail | null>(null);

  constructor() {
    super();
    this.paths = loadStoredPaths();
    this.updateNavCount();
  }

  setPaths(paths: LearningPathDetail[]) {
    this.paths = [...paths];
    this.save();
  }

  updateNavCount() {
    orgNavCountsApi.setCount('learningPaths', this.paths.length);
  }

  private save() {
    saveStoredPaths(this.paths);
    this.updateNavCount();
  }

  async listPaths(): Promise<void> {
    if (this.paths.length === 0) {
      this.paths = loadStoredPaths();
    }
    this.updateNavCount();
  }

  async getPath(pathId: string): Promise<LearningPathDetail | null> {
    if (this.paths.length === 0) {
      this.paths = loadStoredPaths();
    }
    let found = this.paths.find((p) => p.id === pathId || p.slug === pathId);
    if (found) {
      this.currentPath = found;
      return this.currentPath;
    }
    return null;
  }

  async createPath(data: { name: string; slug: string; description?: string }): Promise<string> {
    const id = `lp-${Date.now()}`;
    const slug = data.slug || slugify(data.name);
    const newPath: LearningPathDetail = {
      id,
      organizationId: 'org-1',
      name: data.name,
      slug,
      description: data.description || null,
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
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.paths = [newPath, ...this.paths];
    this.currentPath = newPath;
    this.save();
    return id;
  }

  async updatePath(pathId: string, data: {}): Promise<void> {
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
          const description = orgCourse?.description || null;
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
