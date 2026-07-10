const PENDING_COURSE_ENROLL_KEY = 'cio_pending_course_enroll';

export type PendingCourseEnroll = {
  courseId: string;
};

export function setPendingCourseEnroll(courseId: string): void {
  const payload: PendingCourseEnroll = { courseId };
  sessionStorage.setItem(PENDING_COURSE_ENROLL_KEY, JSON.stringify(payload));
}

export function consumePendingCourseEnroll(courseId: string): boolean {
  const raw = sessionStorage.getItem(PENDING_COURSE_ENROLL_KEY);
  if (!raw) {
    return false;
  }

  try {
    const pending = JSON.parse(raw) as PendingCourseEnroll;
    if (pending.courseId !== courseId) {
      return false;
    }

    sessionStorage.removeItem(PENDING_COURSE_ENROLL_KEY);
    return true;
  } catch {
    sessionStorage.removeItem(PENDING_COURSE_ENROLL_KEY);
    return false;
  }
}

export function clearPendingCourseEnroll(): void {
  sessionStorage.removeItem(PENDING_COURSE_ENROLL_KEY);
}
