import type {
  TPublicApiCourseAnalyticsQuery,
  TPublicApiCourseAnalyticsSection,
  TPublicApiCourseAnalyticsStudentsQuery,
  TPublicApiCourseParam
} from '@cio/utils/validation/public-api';
import {
  assertCourseBelongsToOrganization,
  assertCourseTeamMemberOrOrgAdmin,
  toPublicApiPagination
} from '@api/services/v1/shared';
import { buildCourseStudentAnalytics, getCourseAnalytics } from '@cio/core/services/course/course';
import { getPaginatedCourseMembers } from '@cio/db/queries/course/people';
import { ROLE } from '@cio/utils/constants';
import { PUBLIC_API_ANALYTICS_TTL_SECONDS, publicApiAnalyticsKey } from '@api/utils/redis/key-generators';
import { cachedRead, type CachedRead } from '@api/utils/redis/cached-read';
import { getCourseFunnel } from '@api/services/analytics';

const TTL = PUBLIC_API_ANALYTICS_TTL_SECONDS;

async function assertCourseAnalyticsAccess(orgId: string, actorId: string | null, params: TPublicApiCourseParam) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCourseTeamMemberOrOrgAdmin(params.courseId, actorId);
}

// `getCourseAnalytics` still builds every student row to get the averages; the cache bounds that to once per TTL.
async function loadCourseSummary(courseId: string) {
  const analytics = await getCourseAnalytics(courseId);

  return {
    totalTutors: analytics.totalTutors,
    totalStudents: analytics.totalStudents,
    totalLessons: analytics.totalLessons,
    totalExercises: analytics.totalExercises,
    averageProgress: analytics.lessonCompletionRate,
    averageExerciseCompletion: analytics.exerciseCompletionRate,
    averageGrade: analytics.averageGrade
  };
}

function readSection(
  orgId: string,
  courseId: string,
  section: TPublicApiCourseAnalyticsSection,
  days: number
): Promise<CachedRead<unknown>> {
  switch (section) {
    case 'summary':
      return cachedRead(publicApiAnalyticsKey('course-summary', courseId), TTL, () => loadCourseSummary(courseId));
    case 'funnel':
      return cachedRead(publicApiAnalyticsKey('course-funnel', courseId, days), TTL, () =>
        getCourseFunnel(orgId, days, courseId, true)
      );
  }
}

/** Course analytics, one cached read per requested section. Mirrors `courseTeamMemberMiddleware`. */
export async function getPublicApiCourseAnalyticsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  query: TPublicApiCourseAnalyticsQuery
) {
  await assertCourseAnalyticsAccess(orgId, actorId, params);

  const include = [...new Set(query.include)];
  const entries = await Promise.all(include.map((section) => readSection(orgId, params.courseId, section, query.days)));

  return {
    data: Object.fromEntries(include.map((section, index) => [section, entries[index].data])),
    meta: {
      include,
      days: query.days,
      generatedAt: entries.map((entry) => entry.generatedAt).sort()[0] ?? null
    }
  };
}

async function loadCourseStudentsPage(courseId: string, query: TPublicApiCourseAnalyticsStudentsQuery) {
  const { items: pageMembers, total } = await getPaginatedCourseMembers(courseId, {
    page: query.page,
    limit: query.limit,
    roleId: ROLE.STUDENT,
    membership: 'joined',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  // A student whose stats fail to load fails the page, so totals always match the rows and zeros are never cached.
  const rows = await buildCourseStudentAnalytics(courseId, pageMembers, { failOnError: true });
  const items = rows.map((student) => ({
    profileId: student.id,
    fullname: student.profile.fullname,
    email: student.profile.email,
    avatarUrl: student.profile.avatar_url,
    lessonsCompleted: student.lessonsCompleted,
    totalLessons: student.totalLessons,
    exercisesSubmitted: student.exercisesSubmitted,
    totalExercises: student.totalExercises,
    averageGrade: student.averageGrade,
    progressPercentage: student.progressPercentage,
    lastSeen: student.lastSeen ?? null
  }));

  return { items, pagination: toPublicApiPagination(query.page, query.limit, total) };
}

export async function listPublicApiCourseAnalyticsStudentsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  query: TPublicApiCourseAnalyticsStudentsQuery
) {
  await assertCourseAnalyticsAccess(orgId, actorId, params);

  const { data } = await cachedRead(
    publicApiAnalyticsKey('course-students', params.courseId, query.page, query.limit),
    TTL,
    () => loadCourseStudentsPage(params.courseId, query)
  );

  return data;
}
