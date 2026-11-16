export interface TCourseCommentThreadLocation {
  threadId: string;
  lessonId: string | null;
  exerciseId: string | null;
}

/**
 * The dashboard path that opens a comment thread: on its lesson or exercise page, or on the
 * course's lessons page for course-wide threads.
 */
export function buildCourseCommentThreadPath(courseId: string, location: TCourseCommentThreadLocation): string {
  const query = `?thread=${encodeURIComponent(location.threadId)}`;

  if (location.lessonId) return `/courses/${courseId}/lessons/${location.lessonId}${query}`;
  if (location.exerciseId) return `/courses/${courseId}/exercises/${location.exerciseId}${query}`;

  return `/courses/${courseId}/lessons${query}`;
}
