import { getCourseRouteBase } from './functions';

export function getStudentCourseContinuePath(courseId: string, publicId?: string | null): string {
  const base = publicId ? `/paths/${publicId}/courses` : getCourseRouteBase();

  return `${base}/${courseId}/lessons?next=true`;
}
