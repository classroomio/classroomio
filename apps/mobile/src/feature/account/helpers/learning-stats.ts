import type { LearningStats } from '@/feature/account/types/account';
import { learningStatusOf } from '@/feature/course/helpers/learning-status';
import type { EnrolledCourse } from '@/feature/course/types/course';

export function learningStatsOf(courses: EnrolledCourse[]): LearningStats {
  return courses.reduce<LearningStats>(
    (stats, course) => {
      const status = learningStatusOf(course);

      return {
        inProgress: stats.inProgress + (status === 'in-progress' ? 1 : 0),
        completed: stats.completed + (status === 'completed' ? 1 : 0),
        certificates: stats.certificates + (course.certificateEarnedAt ? 1 : 0)
      };
    },
    { inProgress: 0, completed: 0, certificates: 0 }
  );
}
