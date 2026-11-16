import * as schema from '@db/schema';
import { and, db, desc, eq, isNull, sql, type DbOrTxClient } from '@db/drizzle';

export type StudentReportWrite = typeof schema.studentReport.$inferInsert;

export async function insertStudentReport(values: StudentReportWrite, dbClient: DbOrTxClient = db) {
  try {
    const [row] = await dbClient.insert(schema.studentReport).values(values).returning();

    return row;
  } catch (error) {
    console.error('insertStudentReport error:', error);
    throw new Error('Failed to create the report');
  }
}

/** Reports created for one student in a course, newest first. The token itself is never stored. */
export async function listStudentReports(courseId: string, profileId: string, dbClient: DbOrTxClient = db) {
  try {
    return await dbClient
      .select({
        id: schema.studentReport.id,
        periodStart: schema.studentReport.periodStart,
        periodEnd: schema.studentReport.periodEnd,
        parentEmail: schema.studentReport.parentEmail,
        expiresAt: schema.studentReport.expiresAt,
        revokedAt: schema.studentReport.revokedAt,
        lastViewedAt: schema.studentReport.lastViewedAt,
        viewCount: schema.studentReport.viewCount,
        createdAt: schema.studentReport.createdAt
      })
      .from(schema.studentReport)
      .where(and(eq(schema.studentReport.courseId, courseId), eq(schema.studentReport.profileId, profileId)))
      .orderBy(desc(schema.studentReport.createdAt));
  } catch (error) {
    console.error('listStudentReports error:', error);
    throw new Error('Failed to list reports');
  }
}

export async function revokeStudentReport(courseId: string, reportId: string, dbClient: DbOrTxClient = db) {
  try {
    const [row] = await dbClient
      .update(schema.studentReport)
      .set({ revokedAt: new Date().toISOString() })
      .where(
        and(
          eq(schema.studentReport.id, reportId),
          eq(schema.studentReport.courseId, courseId),
          isNull(schema.studentReport.revokedAt)
        )
      )
      .returning({ id: schema.studentReport.id });

    return row ?? null;
  } catch (error) {
    console.error('revokeStudentReport error:', error);
    throw new Error('Failed to revoke the report');
  }
}

/** The report behind a share token with the branding and names the public page shows. */
export async function getStudentReportByTokenHash(tokenHash: string, dbClient: DbOrTxClient = db) {
  try {
    const [row] = await dbClient
      .select({
        id: schema.studentReport.id,
        courseId: schema.studentReport.courseId,
        profileId: schema.studentReport.profileId,
        periodStart: schema.studentReport.periodStart,
        periodEnd: schema.studentReport.periodEnd,
        teacherComment: schema.studentReport.teacherComment,
        expiresAt: schema.studentReport.expiresAt,
        revokedAt: schema.studentReport.revokedAt,
        studentName: schema.profile.fullname,
        courseTitle: schema.course.title,
        orgName: schema.organization.name,
        orgLogoUrl: schema.organization.avatarUrl,
        orgTheme: schema.organization.theme
      })
      .from(schema.studentReport)
      .innerJoin(schema.profile, eq(schema.profile.id, schema.studentReport.profileId))
      .innerJoin(schema.course, eq(schema.course.id, schema.studentReport.courseId))
      .innerJoin(schema.organization, eq(schema.organization.id, schema.studentReport.organizationId))
      .where(eq(schema.studentReport.tokenHash, tokenHash))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getStudentReportByTokenHash error:', error);
    throw new Error('Failed to load the report');
  }
}

export async function recordStudentReportView(reportId: string, dbClient: DbOrTxClient = db) {
  try {
    await dbClient
      .update(schema.studentReport)
      .set({
        lastViewedAt: new Date().toISOString(),
        viewCount: sql`${schema.studentReport.viewCount} + 1`
      })
      .where(eq(schema.studentReport.id, reportId));
  } catch (error) {
    console.error('recordStudentReportView error:', error);
  }
}

export type StudentExerciseScoreRow = {
  exerciseId: string;
  title: string;
  score: number;
  maxScore: number;
  submittedAt: string;
};

/**
 * The student's latest completed attempt per exercise created inside the period, with the points available.
 * Parent questions of multi-part questions carry no points of their own, so only leaf questions count.
 */
export async function getStudentExerciseScores(
  courseId: string,
  profileId: string,
  periodStart: string,
  periodEnd: string,
  dbClient: DbOrTxClient = db
): Promise<StudentExerciseScoreRow[]> {
  try {
    const rows = await dbClient.execute<{
      exerciseId: string;
      title: string;
      score: string;
      maxScore: string;
      submittedAt: string;
    }>(sql`
      SELECT DISTINCT ON (submission.exercise_id)
        submission.exercise_id AS "exerciseId",
        exercise.title AS "title",
        COALESCE(submission.total, 0) AS "score",
        (
          SELECT COALESCE(SUM(question.points), 0)
          FROM question
          WHERE question.exercise_id = exercise.id
            AND NOT EXISTS (SELECT 1 FROM question child WHERE child.parent_question_id = question.id)
        ) AS "maxScore",
        submission.created_at AS "submittedAt"
      FROM submission
      JOIN groupmember member ON member.id = submission.submitted_by
      JOIN exercise ON exercise.id = submission.exercise_id
      WHERE exercise.course_id = ${courseId}
        AND member.profile_id = ${profileId}
        AND submission.grading_state = 'completed'
        AND submission.created_at >= ${periodStart}::timestamptz
        AND submission.created_at <= ${periodEnd}::timestamptz
      ORDER BY submission.exercise_id, submission.created_at DESC
    `);

    return Array.from(rows)
      .map((row) => ({
        exerciseId: row.exerciseId,
        title: row.title,
        score: Number(row.score),
        maxScore: Number(row.maxScore),
        submittedAt: new Date(row.submittedAt).toISOString()
      }))
      .sort((first, second) => second.submittedAt.localeCompare(first.submittedAt));
  } catch (error) {
    console.error('getStudentExerciseScores error:', error);
    throw new Error('Failed to load the student scores');
  }
}
