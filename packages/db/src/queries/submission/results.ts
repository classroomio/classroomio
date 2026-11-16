import * as schema from '@db/schema';

import { and, asc, count, db, desc, eq, inArray, sql } from '@db/drizzle';

export type ExerciseResultsFilters = {
  filter: 'all' | 'wrong' | 'awaiting';
  cohortId?: string;
};

function latestSubmissionPerStudent(courseId: string, exerciseId: string) {
  return db
    .selectDistinctOn([schema.submission.submittedBy], {
      id: schema.submission.id,
      submittedBy: schema.submission.submittedBy,
      total: schema.submission.total,
      gradingState: schema.submission.gradingState,
      createdAt: schema.submission.createdAt
    })
    .from(schema.submission)
    .where(and(eq(schema.submission.courseId, courseId), eq(schema.submission.exerciseId, exerciseId)))
    .orderBy(schema.submission.submittedBy, desc(schema.submission.createdAt), desc(schema.submission.id))
    .as('latest_submission');
}

/**
 * One page of an exercise's results: each student's latest attempt with every answer, ordered by name. `wrong` keeps
 * students holding an answer below full marks; `awaiting` keeps attempts a teacher still has to grade; a cohort keeps
 * its members.
 */
export async function getExerciseResultsPage(
  courseId: string,
  exerciseId: string,
  filters: ExerciseResultsFilters,
  paging: { page: number; limit: number }
) {
  try {
    const latest = latestSubmissionPerStudent(courseId, exerciseId);
    const hasWrongAnswer = sql`exists (
      select 1 from ${schema.questionAnswer} qa
      join ${schema.question} q on q.id = qa.question_id
      where qa.submission_id = ${latest.id} and coalesce(qa.point, 0) < coalesce(q.points, 0)
    )`;
    const isCohortMember = filters.cohortId
      ? sql`exists (
          select 1 from ${schema.cohortMember} cm
          where cm.cohort_id = ${filters.cohortId} and cm.profile_id = ${schema.groupmember.profileId}
        )`
      : undefined;
    const where = and(
      filters.filter === 'awaiting' ? eq(latest.gradingState, 'awaiting_manual') : undefined,
      filters.filter === 'wrong' ? hasWrongAnswer : undefined,
      isCohortMember
    );

    const [students, [totalRow]] = await Promise.all([
      db
        .select({
          submissionId: latest.id,
          total: latest.total,
          gradingState: latest.gradingState,
          submittedAt: latest.createdAt,
          groupMemberId: latest.submittedBy,
          profileId: schema.profile.id,
          fullname: schema.profile.fullname,
          avatarUrl: schema.profile.avatarUrl
        })
        .from(latest)
        .leftJoin(schema.groupmember, eq(latest.submittedBy, schema.groupmember.id))
        .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
        .where(where)
        .orderBy(asc(schema.profile.fullname), asc(latest.id))
        .limit(paging.limit)
        .offset((paging.page - 1) * paging.limit),
      db
        .select({ total: count() })
        .from(latest)
        .leftJoin(schema.groupmember, eq(latest.submittedBy, schema.groupmember.id))
        .where(where)
    ]);

    const submissionIds = students.map((student) => student.submissionId);
    const answers =
      submissionIds.length > 0
        ? await db
            .select({
              submissionId: schema.questionAnswer.submissionId,
              questionId: schema.questionAnswer.questionId,
              answerData: schema.questionAnswer.answerData,
              point: schema.questionAnswer.point
            })
            .from(schema.questionAnswer)
            .where(inArray(schema.questionAnswer.submissionId, submissionIds))
        : [];

    return { students, answers, total: totalRow?.total ?? 0 };
  } catch (error) {
    console.error('getExerciseResultsPage error:', error);
    throw new Error(
      `Failed to get results for exercise "${exerciseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/** The cohorts attached to a course, for the results filter. */
export async function getCohortsForCourse(courseId: string) {
  try {
    return await db
      .select({ id: schema.cohort.id, name: schema.cohort.name })
      .from(schema.cohortCourse)
      .innerJoin(schema.cohort, eq(schema.cohortCourse.cohortId, schema.cohort.id))
      .where(eq(schema.cohortCourse.courseId, courseId))
      .orderBy(asc(schema.cohort.name));
  } catch (error) {
    console.error('getCohortsForCourse error:', error);
    throw new Error(
      `Failed to get cohorts for course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/** Every student's latest answer to one question, with the student's name, for grouping into clusters. */
export async function getLatestAnswersForQuestion(courseId: string, exerciseId: string, questionId: number) {
  try {
    const latest = latestSubmissionPerStudent(courseId, exerciseId);

    return await db
      .select({
        submissionId: latest.id,
        studentId: schema.profile.id,
        studentName: schema.profile.fullname,
        answerData: schema.questionAnswer.answerData,
        point: schema.questionAnswer.point
      })
      .from(latest)
      .innerJoin(
        schema.questionAnswer,
        and(eq(schema.questionAnswer.submissionId, latest.id), eq(schema.questionAnswer.questionId, questionId))
      )
      .leftJoin(schema.groupmember, eq(latest.submittedBy, schema.groupmember.id))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .orderBy(asc(schema.profile.fullname));
  } catch (error) {
    console.error('getLatestAnswersForQuestion error:', error);
    throw new Error(
      `Failed to get answers to question ${questionId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
