import { buildLearnerComplianceOverview } from '@api/services/course/compliance';
import { getEnrolledCourses } from '@cio/db/queries/course/course';

import { countOverdue, selectDueSoon, selectNextLiveClass } from './home-digest-selection';

/**
 * The Home screen summary for a learner in one organization: compliance work due within 30 days, the overdue count,
 * and the live session running now or starting next.
 */
export async function getHomeDigest(orgId: string, profileId: string) {
  const now = new Date();
  const enrolledCourses = await getEnrolledCourses({ orgId, profileId });
  const compliance = await buildLearnerComplianceOverview(enrolledCourses, profileId);

  const dueSoon = selectDueSoon(compliance.requirements, now);
  const overdueCount = countOverdue(compliance.requirements);
  const nextLiveClass = selectNextLiveClass(enrolledCourses, now);

  return {
    dueSoon,
    overdueCount,
    nextLiveClass,
    complianceStatus: compliance.status,
    generatedAt: now.toISOString()
  };
}
