import {
  getMockPathsForUser,
  getMockPathById,
  getCourseProgressList,
  findCourseInEnrolledMockPath,
  MOCK_PATHS
} from '../utils/mock-data';
import type { LearningPathWithEnrollment, LearningPathCourseProgress } from '../utils/types';
import type { CourseInPathContext, CourseInPathNode } from '../components/types';

const sleep = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms));

class LearningPathApi {
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

    return MOCK_PATHS.filter((path) => !enrolledIds.has(path.id))
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

export const learningPathApi = /* @__PURE__ */ new LearningPathApi();
