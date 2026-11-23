import { AppError, ErrorCodes } from '@api/utils/errors';
import { getStudentCapacity } from '@api/services/organization/student-limit';
import { listOrganizationPeople } from '@cio/db/queries/organization/insights';
import { getGradableCoursesInOrg } from '@cio/db/queries/submission/grading-queue';
import { countLearnerActivitySince } from '@cio/db/queries/teaching/activity';
import { getLearnerProgressSummary } from '@cio/db/queries/teaching/learner-progress';
import { ROLE } from '@cio/utils/constants/roles';
import type { TOrgPeopleQuery, TOrgPeopleRoleFilter } from '@cio/utils/validation/organization';

const DAY_MS = 24 * 60 * 60 * 1000;

const ACTIVE_LEARNER_WINDOW_DAYS = 30;

const RECENT_ACTIVITY_WINDOW_DAYS = 7;

const DRAFT_COURSES_LIMIT = 10;

const ROLE_IDS_BY_FILTER: Record<TOrgPeopleRoleFilter, number[]> = {
  all: [ROLE.ADMIN, ROLE.TUTOR, ROLE.STUDENT],
  students: [ROLE.STUDENT],
  tutors: [ROLE.TUTOR],
  admins: [ROLE.ADMIN]
};

const ROLE_KEY_BY_ID: Record<number, 'admin' | 'tutor' | 'student'> = {
  [ROLE.ADMIN]: 'admin',
  [ROLE.TUTOR]: 'tutor',
  [ROLE.STUDENT]: 'student'
};

function toAppError(error: unknown, fallback: string): AppError {
  if (error instanceof AppError) return error;

  return new AppError(error instanceof Error ? error.message : fallback, ErrorCodes.INTERNAL_ERROR, 500);
}

/**
 * Organization health for the admin home: learners active in the last 30 days, the share of enrollments finished,
 * average progress, student events in the last 7 days, course counts, and the draft courses most recently edited.
 */
export async function getOrganizationHealth(orgId: string, adminProfileId: string) {
  try {
    const courses = await getGradableCoursesInOrg(orgId, adminProfileId, true);
    const courseIds = courses.map((course) => course.id);
    const now = Date.now();
    const [summary, recentActivity] = await Promise.all([
      getLearnerProgressSummary(courseIds, new Date(now - ACTIVE_LEARNER_WINDOW_DAYS * DAY_MS)),
      countLearnerActivitySince(courseIds, new Date(now - RECENT_ACTIVITY_WINDOW_DAYS * DAY_MS))
    ]);
    const drafts = courses
      .filter((course) => !course.isPublished)
      .sort((left, right) => (right.updatedAt ?? '').localeCompare(left.updatedAt ?? ''));

    return {
      learners: summary.learners,
      activeLearners: summary.activeLearners,
      completionRate:
        summary.enrollments > 0 ? Math.round((summary.completedEnrollments / summary.enrollments) * 100) : 0,
      averageProgress: summary.averageProgress,
      recentActivity,
      courses: { total: courses.length, published: courses.length - drafts.length, drafts: drafts.length },
      draftCourses: drafts.slice(0, DRAFT_COURSES_LIMIT).map((course) => ({
        id: course.id,
        title: course.title,
        type: course.type,
        bannerImage: course.bannerImage,
        logo: course.logo,
        updatedAt: course.updatedAt
      }))
    };
  } catch (error) {
    throw toAppError(error, 'Failed to load organization health');
  }
}

/** Organization members filtered by role and search, newest first, with each one's course count. */
export async function listOrganizationPeopleService(orgId: string, query: TOrgPeopleQuery) {
  try {
    const { rows, total } = await listOrganizationPeople({
      organizationId: orgId,
      roleIds: ROLE_IDS_BY_FILTER[query.role],
      search: query.search || undefined,
      limit: query.limit,
      offset: (query.page - 1) * query.limit
    });

    return {
      items: rows.map((row) => ({
        memberId: row.memberId,
        profileId: row.profileId,
        fullname: row.fullname || row.username || row.email || '',
        email: row.email,
        avatarUrl: row.avatarUrl,
        role: ROLE_KEY_BY_ID[row.roleId] ?? 'student',
        status: row.status,
        invited: !row.profileId,
        joinedAt: row.joinedAt,
        lastActiveAt: row.lastActiveAt,
        courseCount: row.courseCount
      })),
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) }
    };
  } catch (error) {
    throw toAppError(error, 'Failed to load organization people');
  }
}

/** Active students against the plan's limit, so invite actions can be turned off before they fail. */
export async function getOrganizationStudentCapacity(orgId: string) {
  try {
    return await getStudentCapacity(orgId);
  } catch (error) {
    throw toAppError(error, 'Failed to load student capacity');
  }
}
