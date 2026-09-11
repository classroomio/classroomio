import { BaseApiWithErrors } from '$lib/utils/services/api';
import type {
  LearningPathSummary,
  LearningPathDetail,
  LearningPathMetrics,
  TCreateLearningPath,
  TUpdateLearningPath
} from '../utils/types';
import { computeMetrics, slugify } from '../utils/learning-path-utils';
import { MOCK_PATHS, MOCK_AVAILABLE_ORG_COURSES } from '../utils/mock-data';

export class LearningPathApi extends BaseApiWithErrors {
  paths = $state<LearningPathSummary[]>([]);
  currentPath = $state<LearningPathDetail | null>(null);
  metrics = $state<LearningPathMetrics>({
    activePaths: 0,
    enrolledLearners: 0,
    completions: 0,
    completionRate: 0
  });

  constructor() {
    super();
    this.paths = [...MOCK_PATHS];
    this.recomputeMetrics();
  }

  recomputeMetrics() {
    this.metrics = computeMetrics(this.paths);
  }

  async listPaths(): Promise<void> {
    if (this.paths.length === 0) {
      this.paths = [...MOCK_PATHS];
    }
    this.recomputeMetrics();
  }

  async getPath(pathId: string): Promise<LearningPathDetail | null> {
    const found = this.paths.find((p) => p.id === pathId || p.slug === pathId);
    if (found) {
      const fullDetail = MOCK_PATHS.find((p) => p.id === found.id) || (found as LearningPathDetail);
      this.currentPath = { ...fullDetail };
      return this.currentPath;
    }
    const defaultDetail = MOCK_PATHS[0];
    this.currentPath = { ...defaultDetail };
    return this.currentPath;
  }

  async createPath(data: TCreateLearningPath): Promise<string> {
    const id = `lp-${Date.now()}`;
    const slug = data.slug || slugify(data.name);
    const newPath: LearningPathDetail = {
      id,
      organizationId: 'org-1',
      name: data.name,
      slug,
      description: data.description || null,
      coverImage: null,
      status: 'DRAFT',
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
    this.recomputeMetrics();
    return id;
  }

  async updatePath(pathId: string, data: TUpdateLearningPath): Promise<void> {
    if (this.currentPath && (this.currentPath.id === pathId || this.currentPath.slug === pathId)) {
      this.currentPath = {
        ...this.currentPath,
        ...data,
        updatedAt: new Date().toISOString()
      };
    }
    this.paths = this.paths.map((p) =>
      p.id === pathId || p.slug === pathId
        ? {
            ...p,
            ...data,
            updatedAt: new Date().toISOString()
          }
        : p
    );
    this.recomputeMetrics();
  }

  async deletePath(pathId: string): Promise<void> {
    this.paths = this.paths.filter((p) => p.id !== pathId && p.slug !== pathId);
    if (this.currentPath?.id === pathId || this.currentPath?.slug === pathId) {
      this.currentPath = null;
    }
    this.recomputeMetrics();
  }

  async addCourses(pathId: string, courseIds: string[]): Promise<void> {
    if (!this.currentPath || (this.currentPath.id !== pathId && this.currentPath.slug !== pathId)) return;

    const existingIds = new Set(this.currentPath.courses.map((c) => c.courseId));
    const newItems = courseIds
      .filter((cid) => !existingIds.has(cid))
      .map((cid, index) => {
        const found = MOCK_AVAILABLE_ORG_COURSES.find((ac) => ac.id === cid);
        const order = this.currentPath!.courses.length + index + 1;
        return {
          id: `lpc-${Date.now()}-${index}`,
          courseId: cid,
          order,
          title: found?.title || 'New Course',
          description: found?.description || null,
          lessonsCount: found?.lessonsCount || 8,
          exercisesCount: found?.exercisesCount || 2,
          cost: found?.cost || 49,
          currency: 'USD',
          thumbnailGradient: 'linear-gradient(135deg, oklch(0.685 0.169 237.323), oklch(0.488 0.243 264.376))'
        };
      });

    const updatedCourses = [...this.currentPath.courses, ...newItems];
    this.currentPath.courses = updatedCourses;
    this.currentPath.courseCount = updatedCourses.length;
    this.currentPath.updatedAt = new Date().toISOString();

    this.paths = this.paths.map((p) =>
      p.id === pathId || p.slug === pathId
        ? {
            ...p,
            courseCount: updatedCourses.length,
            updatedAt: new Date().toISOString()
          }
        : p
    );
  }

  async removeCourse(pathId: string, courseId: string): Promise<void> {
    if (!this.currentPath || (this.currentPath.id !== pathId && this.currentPath.slug !== pathId)) return;

    const remaining = this.currentPath.courses
      .filter((c) => c.id !== courseId && c.courseId !== courseId)
      .map((c, index) => ({ ...c, order: index + 1 }));

    this.currentPath.courses = remaining;
    this.currentPath.courseCount = remaining.length;
    this.currentPath.updatedAt = new Date().toISOString();

    this.paths = this.paths.map((p) =>
      p.id === pathId || p.slug === pathId
        ? {
            ...p,
            courseCount: remaining.length,
            updatedAt: new Date().toISOString()
          }
        : p
    );
  }

  async reorderCourses(pathId: string, orderedCourseIds: string[]): Promise<void> {
    if (!this.currentPath || (this.currentPath.id !== pathId && this.currentPath.slug !== pathId)) return;

    const courseMap = new Map(this.currentPath.courses.map((c) => [c.id, c]));
    const reordered = orderedCourseIds
      .map((id, index) => {
        const item = courseMap.get(id);
        if (!item) return null;
        return {
          ...item,
          order: index + 1
        };
      })
      .filter(Boolean) as typeof this.currentPath.courses;

    this.currentPath.courses = reordered;
    this.currentPath.courseOrderSetAt = new Date().toISOString();
    this.currentPath.updatedAt = new Date().toISOString();

    this.paths = this.paths.map((p) =>
      p.id === pathId || p.slug === pathId
        ? {
            ...p,
            courseOrderSetAt: this.currentPath!.courseOrderSetAt,
            updatedAt: new Date().toISOString()
          }
        : p
    );
  }
}

export const learningPathApi = new LearningPathApi();
