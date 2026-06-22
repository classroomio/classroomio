import { getCourseById, getUpcomingSessionsForCourseIds } from '@cio/db/queries/course';
import { buildSessionIcs } from '@cio/email';

/**
 * Build the calendar invite (.ics) for a course's next upcoming live session,
 * for attaching to the welcome email on enrollment. Returns undefined when the
 * course is not a LIVE_CLASS or has no upcoming session. The invite reuses the
 * same UID as the session reminders, so calendars treat them as one event.
 */
export async function getWelcomeSessionIcs(courseId: string): Promise<string | undefined> {
  try {
    const courseRows = await getCourseById(courseId);
    const course = courseRows?.[0];
    if (!course || course.type !== 'LIVE_CLASS') {
      return undefined;
    }

    const upcoming = (await getUpcomingSessionsForCourseIds([courseId])).get(courseId);
    if (!upcoming) {
      return undefined;
    }

    return buildSessionIcs({
      uid: `session-${upcoming.lessonId}@classroomio`,
      sequence: 0,
      method: 'PUBLISH',
      start: upcoming.lessonAt,
      title: upcoming.lessonTitle,
      description: `Join your live session: ${upcoming.callUrl}`,
      url: upcoming.callUrl,
      alarmsBeforeMinutes: [1440, 60]
    });
  } catch (error) {
    console.error('getWelcomeSessionIcs error:', error);
    return undefined;
  }
}
