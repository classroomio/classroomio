import type {
  TPublicApiAnalyticsFunnelQuery,
  TPublicApiAnalyticsRangeQuery,
  TPublicApiCourseParam,
  TPublicApiLearnerAnalyticsParam,
  TPublicApiLoginActivityQuery,
  TPublicApiPaginationQuery
} from '@cio/utils/validation/public-api';
import {
  assertCourseBelongsToOrganization,
  assertCourseTeamMemberOrOrgAdmin,
  assertOrgAdmin,
  assertOrgTeamMember,
  assertProfileBelongsToOrganization,
  paginateInMemory
} from '@api/services/v1/shared';
import {
  getCountryBreakdown,
  getCourseFunnel,
  getLandingStats,
  getPopularTypes,
  getTopCoursesByViews
} from '@api/services/analytics';
import { getOrganisationAnalytics, getStudentLoginActivity } from '@api/services/dash';
import {
  buildCourseStudentAnalytics,
  getCourseAnalytics,
  listCourseAnalyticsStudents
} from '@cio/core/services/course/course';
import { getOrgComplianceOverview } from '@api/services/course/compliance';
import { getUserAnalytics } from '@api/services/organization';

export async function getPublicApiAnalyticsOverviewService(orgId: string, actorId: string | null) {
  await assertOrgTeamMember(orgId, actorId);

  return getOrganisationAnalytics(orgId);
}

export async function getPublicApiAnalyticsTrafficService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiAnalyticsRangeQuery
) {
  await assertOrgTeamMember(orgId, actorId);

  return getLandingStats(orgId, query.days);
}

export async function getPublicApiAnalyticsCountriesService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiAnalyticsRangeQuery
) {
  await assertOrgTeamMember(orgId, actorId);

  return getCountryBreakdown(orgId, query.days);
}

export async function getPublicApiAnalyticsFunnelService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiAnalyticsFunnelQuery
) {
  await assertOrgTeamMember(orgId, actorId);

  if (query.courseId) {
    await assertCourseBelongsToOrganization(orgId, query.courseId);
  }

  return getCourseFunnel(orgId, query.days, query.courseId);
}

export async function getPublicApiAnalyticsCourseTypesService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiAnalyticsRangeQuery
) {
  await assertOrgTeamMember(orgId, actorId);

  return getPopularTypes(orgId, query.days);
}

export async function getPublicApiAnalyticsTopCoursesService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiAnalyticsRangeQuery
) {
  await assertOrgTeamMember(orgId, actorId);

  return getTopCoursesByViews(orgId, query.days);
}

export async function getPublicApiLoginActivityService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiLoginActivityQuery
) {
  await assertOrgAdmin(orgId, actorId);

  return getStudentLoginActivity(orgId, query.days);
}

export async function getPublicApiComplianceOverviewService(orgId: string, actorId: string | null) {
  await assertOrgAdmin(orgId, actorId);

  const { summary, courses } = await getOrgComplianceOverview(orgId);

  return { summary, courses };
}

export async function listPublicApiComplianceLearnersService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiPaginationQuery
) {
  await assertOrgAdmin(orgId, actorId);

  const { learners } = await getOrgComplianceOverview(orgId);

  return paginateInMemory(learners, query);
}

export async function getPublicApiLearnerAnalyticsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLearnerAnalyticsParam
) {
  await assertOrgTeamMember(orgId, actorId);
  await assertProfileBelongsToOrganization(orgId, params.profileId);

  const analytics = await getUserAnalytics(params.profileId, orgId);
  const courses = analytics.courses.map((course) => ({
    id: course.id,
    title: course.title,
    type: course.type ?? null,
    lessonsCount: course.lessons_count,
    lessonsCompleted: course.lessons_completed,
    exercisesCount: course.exercises_count,
    exercisesCompleted: course.exercises_completed,
    progressPercentage: course.progress_percentage,
    progressFailed: course.progress_failed,
    averageGrade: course.average_grade,
    certificateEarnedAt: course.certificateEarnedAt,
    complianceStatus: course.complianceStatus,
    exercises:
      course.exercises?.map((exercise) => ({
        id: exercise.id,
        title: exercise.title,
        lessonId: exercise.lessonId,
        lessonTitle: exercise.lessonTitle,
        status: exercise.status ?? null,
        score: exercise.score,
        totalPoints: exercise.totalPoints,
        isCompleted: exercise.isCompleted
      })) ?? null
  }));

  return {
    user: { ...analytics.user, lastSeen: analytics.user.lastSeen ?? null },
    overallCourseProgress: analytics.overallCourseProgress,
    overallAverageGrade: analytics.overallAverageGrade,
    courses
  };
}

async function assertCourseAnalyticsAccess(orgId: string, actorId: string | null, params: TPublicApiCourseParam) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCourseTeamMemberOrOrgAdmin(params.courseId, actorId);
}

export async function getPublicApiCourseAnalyticsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam
) {
  await assertCourseAnalyticsAccess(orgId, actorId, params);

  const analytics = await getCourseAnalytics(params.courseId);

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

export async function listPublicApiCourseAnalyticsStudentsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  query: TPublicApiPaginationQuery
) {
  await assertCourseAnalyticsAccess(orgId, actorId, params);

  const members = await listCourseAnalyticsStudents(params.courseId);
  const sortName = (member: (typeof members)[number]) => member.profile?.fullname || 'Unknown';
  members.sort((a, b) => sortName(a).localeCompare(sortName(b)) || a.profileId.localeCompare(b.profileId));

  const { items: pageMembers, pagination } = paginateInMemory(members, query);
  const rows = await buildCourseStudentAnalytics(params.courseId, pageMembers);
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

  return { items, pagination };
}
