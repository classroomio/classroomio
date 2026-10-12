import { getReleasedRecordingUrl } from '@cio/utils/functions/live-session';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';

type LessonWithRecording = {
  callUrl: string | null;
  lessonAt: string | null;
  sessionDurationMinutes: number | null;
  recordingUrl: string | null;
};

/**
 * Returns the lessons with `recordingUrl` cleared for learners until each session has ended. Course staff see it as stored.
 */
export async function releaseLessonRecordingsForViewer<T extends LessonWithRecording>(
  courseId: string,
  profileId: string,
  lessons: T[]
): Promise<T[]> {
  const isCourseStaff = await isCourseTeamMemberOrOrgAdmin(courseId, profileId);
  if (isCourseStaff) return lessons;

  return lessons.map((lesson) => ({ ...lesson, recordingUrl: getReleasedRecordingUrl(lesson) }));
}

/**
 * Returns the lessons with `recordingUrl` cleared for everyone but course staff. Use it on responses that do not check
 * the learner's lesson access; learners get released recordings from the lesson detail and course content instead.
 */
export async function hideLessonRecordingsFromLearners<T extends { recordingUrl: string | null }>(
  courseId: string,
  profileId: string,
  lessons: T[]
): Promise<T[]> {
  const isCourseStaff = await isCourseTeamMemberOrOrgAdmin(courseId, profileId);
  if (isCourseStaff) return lessons;

  return lessons.map((lesson) => ({ ...lesson, recordingUrl: null }));
}
