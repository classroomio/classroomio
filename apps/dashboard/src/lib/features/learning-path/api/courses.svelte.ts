import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  AddPathCoursesRequest,
  LearningPathCourseItem,
  RemovePathCourseRequest,
  ReorderPathCoursesRequest
} from '../utils/types';
import { snackbar } from '$features/ui/snackbar/store';
import { learningPathApi } from './learning-path.svelte';

class PathCoursesApi extends BaseApiWithErrors {
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
        await learningPathApi.refreshPath(pathId);
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
        const currentPath = learningPathApi.currentPath;
        if (currentPath && (currentPath.id === pathId || currentPath.publicId === pathId)) {
          const remaining = currentPath.courses.filter((c) => c.courseId !== courseId && c.id !== courseId);
          currentPath.courses = remaining.map((c, idx) => ({ ...c, order: idx + 1 }));
        }
        learningPathApi.paths = learningPathApi.paths.map((p) => {
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
        const currentPath = learningPathApi.currentPath;
        if (currentPath && (currentPath.id === pathId || currentPath.publicId === pathId)) {
          const courseMap = new Map(currentPath.courses.map((c) => [c.courseId, c]));
          const reordered: LearningPathCourseItem[] = [];
          courseIds.forEach((cid, index) => {
            const match = courseMap.get(cid);
            if (match) {
              reordered.push({ ...match, order: index + 1 });
            }
          });
          currentPath.courses = reordered;
        }
        snackbar.success('learningPath.snackbar.reordered');
      }
    });
  }
}

export const pathCoursesApi = new PathCoursesApi();
