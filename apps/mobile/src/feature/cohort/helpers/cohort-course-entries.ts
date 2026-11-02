import type { CohortCourseEntry } from '@/feature/cohort/components/cohort-course-carousel';
import type { CohortCourse } from '@/feature/cohort/types/cohort';
import type { EnrolledCourse } from '@/feature/course/types/course';

/** Pairs each cohort course with the learner's enrolment in it, when they have one, keeping the cohort's order. */
export function cohortCourseEntries(courses: CohortCourse[], enrolled: EnrolledCourse[]): CohortCourseEntry[] {
  const byId = new Map(enrolled.map((course) => [course.id, course]));

  return courses.flatMap((entry): CohortCourseEntry[] => {
    if (!entry.course) return [];

    const enrolment = byId.get(entry.course.id);

    return enrolment ? [{ kind: 'enrolled', course: enrolment }] : [{ kind: 'catalog', course: entry.course }];
  });
}
