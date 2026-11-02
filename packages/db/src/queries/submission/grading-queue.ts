import * as schema from '@db/schema';

import { and, asc, count, eq, exists, inArray, isNotNull, ne, or, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db } from '@db/drizzle';

export type GradableCourse = {
  id: string;
  title: string;
  type: string | null;
  bannerImage: string | null;
  logo: string | null;
};

/**
 * Active, non-template courses in the organization whose submissions the profile can grade: every course for an org
 * admin, otherwise courses where the profile is a course ADMIN/TUTOR or mentors a cohort that includes the course.
 * Mirrors `canAccessCourseSubmissions`; the caller must already have checked the profile's org role.
 */
export async function getGradableCoursesInOrg(
  orgId: string,
  profileId: string,
  isOrgAdmin: boolean
): Promise<GradableCourse[]> {
  try {
    const courseTeamMembership = db
      .select({ id: schema.groupmember.id })
      .from(schema.groupmember)
      .where(
        and(
          eq(schema.groupmember.groupId, schema.group.id),
          eq(schema.groupmember.profileId, profileId),
          inArray(schema.groupmember.roleId, [ROLE.ADMIN, ROLE.TUTOR])
        )
      );

    const cohortMentorship = db
      .select({ id: schema.cohortMember.id })
      .from(schema.cohortCourse)
      .innerJoin(schema.cohort, eq(schema.cohort.id, schema.cohortCourse.cohortId))
      .innerJoin(schema.cohortMember, eq(schema.cohortMember.cohortId, schema.cohort.id))
      .where(
        and(
          eq(schema.cohortCourse.courseId, schema.course.id),
          eq(schema.cohort.organizationId, orgId),
          eq(schema.cohortMember.profileId, profileId),
          inArray(schema.cohortMember.roleId, [ROLE.ADMIN, ROLE.TUTOR])
        )
      );

    const rows = await db
      .select({
        id: schema.course.id,
        title: schema.course.title,
        type: schema.course.type,
        bannerImage: schema.course.bannerImage,
        logo: schema.course.logo
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(
        and(
          eq(schema.group.organizationId, orgId),
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isTemplate, false),
          isOrgAdmin ? undefined : or(exists(courseTeamMembership), exists(cohortMentorship))
        )
      )
      .orderBy(asc(schema.course.title));

    return rows;
  } catch (error) {
    console.error('getGradableCoursesInOrg error:', error);
    throw new Error(`Failed to get gradable courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Submissions in the given courses that are not yet graded, oldest first, with the learner and exercise. */
export async function getUngradedSubmissionsForCourses(courseIds: string[]) {
  if (courseIds.length === 0) return [];

  try {
    return await db
      .select({
        id: schema.submission.id,
        courseId: schema.submission.courseId,
        exerciseId: schema.submission.exerciseId,
        exerciseTitle: schema.exercise.title,
        exerciseDueBy: schema.exercise.dueBy,
        gradingState: schema.submission.gradingState,
        statusId: schema.submission.statusId,
        createdAt: schema.submission.createdAt,
        student: {
          profileId: schema.profile.id,
          fullname: schema.profile.fullname,
          username: schema.profile.username,
          avatarUrl: schema.profile.avatarUrl
        }
      })
      .from(schema.submission)
      .innerJoin(schema.exercise, eq(schema.submission.exerciseId, schema.exercise.id))
      .leftJoin(schema.groupmember, eq(schema.submission.submittedBy, schema.groupmember.id))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(and(inArray(schema.submission.courseId, courseIds), ne(schema.submission.gradingState, 'completed')))
      .orderBy(asc(schema.submission.createdAt), asc(schema.submission.id));
  } catch (error) {
    console.error('getUngradedSubmissionsForCourses error:', error);
    throw new Error(`Failed to get ungraded submissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Distinct question type ids each submission has an answer for, keyed by submission id. */
export async function getAnsweredQuestionTypeIdsBySubmission(submissionIds: string[]) {
  if (submissionIds.length === 0) return new Map<string, number[]>();

  try {
    const rows = await db
      .selectDistinct({
        submissionId: schema.questionAnswer.submissionId,
        questionTypeId: schema.question.questionTypeId
      })
      .from(schema.questionAnswer)
      .innerJoin(schema.question, eq(schema.questionAnswer.questionId, schema.question.id))
      .where(
        and(inArray(schema.questionAnswer.submissionId, submissionIds), isNotNull(schema.questionAnswer.answerData))
      );

    const typeIdsBySubmission = new Map<string, number[]>();
    for (const row of rows) {
      if (!row.submissionId) continue;

      const typeIds = typeIdsBySubmission.get(row.submissionId) ?? [];
      typeIds.push(Number(row.questionTypeId));
      typeIdsBySubmission.set(row.submissionId, typeIds);
    }

    return typeIdsBySubmission;
  } catch (error) {
    console.error('getAnsweredQuestionTypeIdsBySubmission error:', error);
    throw new Error(
      `Failed to get answered question types: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/** Student enrollment and recorded course completions per course. */
export async function getCourseStudentCounts(courseIds: string[]) {
  if (courseIds.length === 0) return [];

  try {
    return await db
      .select({
        courseId: schema.course.id,
        enrolled: count(schema.groupmember.id),
        completed: sql<number>`count(${schema.groupmember.completedAt})::int`
      })
      .from(schema.course)
      .innerJoin(
        schema.groupmember,
        and(eq(schema.groupmember.groupId, schema.course.groupId), eq(schema.groupmember.roleId, ROLE.STUDENT))
      )
      .where(inArray(schema.course.id, courseIds))
      .groupBy(schema.course.id);
  } catch (error) {
    console.error('getCourseStudentCounts error:', error);
    throw new Error(`Failed to count course students: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
