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
  metrics = $state<LearningPathMetrics>({
    activePaths: 0,
    enrolledLearners: 0,
    completions: 0,
    completionRate: 0
  });

  constructor() {
    super();
    this.paths = loadStoredPaths();
    this.recomputeMetrics();
  }

  recomputeMetrics() {
    this.metrics = computeMetrics(this.paths);
  }

  private save() {
    saveStoredPaths(this.paths);
    this.recomputeMetrics();
  }

  async listPaths(): Promise<void> {
    if (this.paths.length === 0) {
      this.paths = loadStoredPaths();
    }
    this.recomputeMetrics();
  }

  async getPath(pathId: string): Promise<LearningPathDetail | null> {
    if (this.paths.length === 0) {
      this.paths = loadStoredPaths();
    }
    let found = this.paths.find((p) => p.id === pathId || p.slug === pathId);
    if (!found) {
      const mock = MOCK_PATHS.find((p) => p.id === pathId || p.slug === pathId);
      if (mock) {
        found = { ...mock };
        this.paths = [...this.paths, found];
        this.save();
      }
    }
    if (found) {
      this.currentPath = found;
      return this.currentPath;
    }
    return null;
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
    this.save();
    return id;
  }

  async updatePath(pathId: string, data: TUpdateLearningPath): Promise<void> {
    const idx = this.paths.findIndex((p) => p.id === pathId || p.slug === pathId);
    if (idx !== -1) {
      const updated: LearningPathDetail = {
        ...this.paths[idx],
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

  async addCourses(pathId: string, courseIds: string[]): Promise<void> {
    const target = this.paths.find((p) => p.id === pathId || p.slug === pathId);
    if (!target) return;

    const existingIds = new Set((target.courses || []).map((c) => c.courseId));
    const newItems = courseIds
      .filter((cid) => !existingIds.has(cid))
      .map((cid, index) => {
        const found = MOCK_AVAILABLE_ORG_COURSES.find((ac) => ac.id === cid);
        const order = (target.courses || []).length + index + 1;
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

    const updatedCourses = [...(target.courses || []), ...newItems];
    target.courses = updatedCourses;
    target.courseCount = updatedCourses.length;
    target.updatedAt = new Date().toISOString();

    this.paths = [...this.paths];
    if (this.currentPath && (this.currentPath.id === pathId || this.currentPath.slug === pathId)) {
      this.currentPath = target;
    }
    this.save();
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
