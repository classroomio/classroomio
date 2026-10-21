import { getCourseById } from '@cio/db/queries/course';
import { getGroupMemberIdByCourseAndProfile } from '@cio/db/queries/group/group';

import { syncComplianceProgressFromSubmission } from './compliance';
import { evaluateAndRecordCourseCompletion } from './completion';

/**
 * Records course completion after the learner's progress changes (a lesson
 * marked complete or a video watched through). Compliance courses also
 * complete their current cycle once the learner qualifies, exactly as after a
 * submission, so a cycle finished by its last lesson does not stay open.
 * Compliance completion is read from that cycle.
 */
export async function recordCourseCompletionFromProgress(courseId: string, profileId: string): Promise<void> {
  const [course] = await getCourseById(courseId);
  const groupMemberId =
    course?.type === 'COMPLIANCE' ? await getGroupMemberIdByCourseAndProfile(courseId, profileId) : null;

  if (groupMemberId) {
    const cycle = await syncComplianceProgressFromSubmission(courseId, groupMemberId);
    if (cycle && cycle.status !== 'not_started') return;
  }

  await evaluateAndRecordCourseCompletion(courseId, profileId);
}
