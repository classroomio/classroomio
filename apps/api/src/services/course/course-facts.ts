import { getCourseFactsSource } from '@cio/db/queries/course/course-facts';
import { resolveCourseFacts, type CourseFacts } from '@cio/utils/functions/course-facts';

type CourseMetadata = Parameters<typeof resolveCourseFacts>[0];

/** Level, length and instructor learners see on the course screen. */
export async function getLearnerCourseFacts(courseId: string, metadata: CourseMetadata): Promise<CourseFacts> {
  const source = await getCourseFactsSource(courseId);

  return resolveCourseFacts(metadata, source?.videoSeconds ?? null, source?.tutorName ?? null);
}
