export function getStudentCourseContinuePath(courseId: string): string {
  return `/courses/${courseId}/lessons?next=true`;
}
