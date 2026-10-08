import type { TPublicApiLearnerAnalyticsParam } from '@cio/utils/validation/public-api';
import { PUBLIC_API_ANALYTICS_TTL_SECONDS, publicApiAnalyticsKey } from '@api/utils/redis/key-generators';
import { assertOrgTeamMember, assertProfileBelongsToOrganization } from '@api/services/v1/shared';
import { cachedRead } from '@api/utils/redis/cached-read';
import { getUserAnalytics } from '@api/services/organization';

async function loadLearnerAnalytics(orgId: string, profileId: string) {
  const analytics = await getUserAnalytics(profileId, orgId);
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

/** Mirrors `orgTeamMemberMiddleware` on `GET /organization/audience/:userId/analytics`. */
export async function getPublicApiLearnerAnalyticsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLearnerAnalyticsParam
) {
  await assertOrgTeamMember(orgId, actorId);
  await assertProfileBelongsToOrganization(orgId, params.profileId);

  const { data } = await cachedRead(
    publicApiAnalyticsKey('learner', orgId, params.profileId),
    PUBLIC_API_ANALYTICS_TTL_SECONDS,
    () => loadLearnerAnalytics(orgId, params.profileId)
  );

  return data;
}
