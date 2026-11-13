import type { TPublicApiPaginationQuery } from '@cio/utils/validation/public-api';
import { PUBLIC_API_ANALYTICS_TTL_SECONDS, publicApiAnalyticsKey } from '@api/utils/redis/key-generators';
import { assertOrgAdmin, paginateInMemory } from '@api/services/v1/shared';
import { cachedRead } from '@api/utils/redis/cached-read';
import { getOrgComplianceOverview } from '@api/services/course/compliance';

/** Shared by the report and the paginated students list, so paging never rebuilds the report. */
function readComplianceOverview(orgId: string) {
  return cachedRead(publicApiAnalyticsKey('compliance', orgId), PUBLIC_API_ANALYTICS_TTL_SECONDS, () =>
    getOrgComplianceOverview(orgId)
  );
}

/** Compliance status counts, overall and per course. Mirrors `orgAdminMiddleware`. */
export async function getPublicApiComplianceAnalyticsService(orgId: string, actorId: string | null) {
  await assertOrgAdmin(orgId, actorId);

  const { data, generatedAt } = await readComplianceOverview(orgId);
  const summary = {
    totalStudents: data.summary.totalLearners,
    totalCourses: data.summary.totalCourses,
    counts: data.summary.counts
  };
  const courses = data.courses.map((course) => ({
    courseId: course.courseId,
    courseTitle: course.courseTitle,
    studentCount: course.learnerCount,
    counts: course.counts
  }));

  return { data: { summary, courses }, meta: { generatedAt } };
}

export async function listPublicApiComplianceStudentsService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiPaginationQuery
) {
  await assertOrgAdmin(orgId, actorId);

  const { data } = await readComplianceOverview(orgId);

  return paginateInMemory(data.learners, query);
}
