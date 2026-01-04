import * as schema from '@db/schema';

import type { TNewQuestionAnswer, TNewSubmission, TQuestionAnswer, TSubmission } from '@db/types';
import { and, db, eq, inArray } from '@db/drizzle';

/**
 * Gets a submission by ID
 * @param submissionId Submission ID
 * @returns Submission or null
 */
export async function getSubmissionById(submissionId: string): Promise<TSubmission | null> {
  try {
    const [submission] = await db
      .select()
      .from(schema.submission)
      .where(eq(schema.submission.id, submissionId))
      .limit(1);
    return submission || null;
  } catch (error) {
    throw new Error(
      `Failed to get submission by ID "${submissionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets submissions by course ID
 * @param courseId Course ID
 * @param exerciseId Optional exercise ID filter
 * @param submittedBy Optional group member ID filter
 * @returns Array of submissions
 */
export async function getSubmissionsByCourseId(
  courseId: string,
  exerciseId?: string,
  submittedBy?: string
): Promise<TSubmission[]> {
  try {
    const conditions = [eq(schema.submission.courseId, courseId)];

    if (exerciseId) {
      conditions.push(eq(schema.submission.exerciseId, exerciseId));
    }

    if (submittedBy) {
      conditions.push(eq(schema.submission.submittedBy, submittedBy));
    }

    return db
      .select()
      .from(schema.submission)
      .where(and(...conditions));
  } catch (error) {
    throw new Error(
      `Failed to get submissions by course ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets submissions by course ID with full related data (answers, profile, etc.)
 * @param courseId Course ID
 * @param exerciseId Optional exercise ID filter
 * @param submittedBy Optional group member ID filter
 * @returns Array of submissions with exercise, groupmember, profile, and answers
 */
export async function getSubmissionsByCourseIdWithDetails(courseId: string, exerciseId?: string, submittedBy?: string) {
  try {
    // Build conditions
    const conditions = [eq(schema.submission.courseId, courseId)];

    if (exerciseId) {
      conditions.push(eq(schema.submission.exerciseId, exerciseId));
    }

    if (submittedBy) {
      conditions.push(eq(schema.submission.submittedBy, submittedBy));
    }

    // Get submissions with relations
    const submissions = await db
      .select({
        submission: schema.submission,
        groupmember: schema.groupmember,
        profile: schema.profile
      })
      .from(schema.submission)
      .leftJoin(schema.groupmember, eq(schema.submission.submittedBy, schema.groupmember.id))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(and(...conditions));

    // Get all question answers for these submissions
    const submissionIds = submissions.map((s) => s.submission.id);
    const questionAnswers =
      submissionIds.length > 0
        ? await db
            .select()
            .from(schema.questionAnswer)
            .where(inArray(schema.questionAnswer.submissionId, submissionIds))
        : [];

    // Group data by submission
    const result = submissions.map((row) => {
      const submissionAnswers = questionAnswers.filter((qa) => qa.submissionId === row.submission.id);

      return {
        ...row.submission,
        groupmember: row.groupmember
          ? {
              ...row.groupmember,
              profile: row.profile
            }
          : null,
        answers: submissionAnswers
      };
    });

    return result;
  } catch (error) {
    throw new Error(
      `Failed to get submissions by course ID with details "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets submissions for grading with all related data
 * @param courseId Course ID
 * @returns Array of submissions with exercise, lesson, groupmember, profile, questions, and answers
 */
export async function getSubmissionsForGrading(courseId: string) {
  try {
    // First, get all submissions with basic relations
    const submissions = await db
      .select({
        submission: schema.submission,
        exercise: schema.exercise,
        lesson: schema.lesson,
        groupmember: schema.groupmember,
        profile: schema.profile
      })
      .from(schema.submission)
      .innerJoin(schema.exercise, eq(schema.submission.exerciseId, schema.exercise.id))
      .innerJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .leftJoin(schema.groupmember, eq(schema.submission.submittedBy, schema.groupmember.id))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(eq(schema.submission.courseId, courseId));

    // Get all question answers for these submissions
    const submissionIds = submissions.map((s) => s.submission.id);
    const questionAnswers =
      submissionIds.length > 0
        ? await db
            .select()
            .from(schema.questionAnswer)
            .where(inArray(schema.questionAnswer.submissionId, submissionIds))
        : [];

    // Get all questions for the exercises
    const exerciseIds = [...new Set(submissions.map((s) => s.exercise.id))];
    const questions =
      exerciseIds.length > 0
        ? await db.select().from(schema.question).where(inArray(schema.question.exerciseId, exerciseIds))
        : [];

    // Get all options for the questions
    const questionIds = [...new Set(questions.map((q) => q.id))];
    const options =
      questionIds.length > 0
        ? await db.select().from(schema.option).where(inArray(schema.option.questionId, questionIds))
        : [];

    // Group data by submission
    const result = submissions.map((row) => {
      const submissionAnswers = questionAnswers.filter((qa) => qa.submissionId === row.submission.id);
      const exerciseQuestions = questions.filter((q) => q.exerciseId === row.exercise.id);
      const questionsWithOptions = exerciseQuestions.map((q) => ({
        ...q,
        options: options.filter((o) => o.questionId === q.id)
      }));

      return {
        ...row.submission,
        exercise: {
          ...row.exercise,
          questions: questionsWithOptions
        },
        lesson: row.lesson,
        groupmember: row.groupmember
          ? {
              ...row.groupmember,
              profile: row.profile
            }
          : null,
        answers: submissionAnswers
      };
    });

    return result;
  } catch (error) {
    throw new Error(
      `Failed to get submissions for grading "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Creates a new submission
 * @param data Submission data
 * @returns Created submission
 */
export async function createSubmission(data: TNewSubmission): Promise<TSubmission> {
  try {
    const [submission] = await db.insert(schema.submission).values(data).returning();
    if (!submission) {
      throw new Error('Failed to create submission');
    }
    return submission;
  } catch (error) {
    throw new Error(`Failed to create submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Updates a submission
 * @param submissionId Submission ID
 * @param data Partial submission data
 * @returns Updated submission or null
 */
export async function updateSubmission(submissionId: string, data: Partial<TSubmission>): Promise<TSubmission | null> {
  try {
    const [updated] = await db
      .update(schema.submission)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.submission.id, submissionId))
      .returning();
    return updated || null;
  } catch (error) {
    throw new Error(
      `Failed to update submission "${submissionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Deletes a submission
 * @param submissionId Submission ID
 * @returns Deleted submission or null
 */
export async function deleteSubmission(submissionId: string): Promise<TSubmission | null> {
  try {
    const [deleted] = await db.delete(schema.submission).where(eq(schema.submission.id, submissionId)).returning();
    return deleted || null;
  } catch (error) {
    throw new Error(
      `Failed to delete submission "${submissionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets question answers for a submission
 * @param submissionId Submission ID
 * @returns Array of question answers
 */
export async function getQuestionAnswersBySubmissionId(submissionId: string): Promise<TQuestionAnswer[]> {
  try {
    return db.select().from(schema.questionAnswer).where(eq(schema.questionAnswer.submissionId, submissionId));
  } catch (error) {
    throw new Error(
      `Failed to get question answers for submission "${submissionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Creates or updates a question answer
 * @param data Question answer data
 * @returns Created or updated question answer
 */
export async function upsertQuestionAnswer(data: TNewQuestionAnswer): Promise<TQuestionAnswer> {
  try {
    // Note: This assumes there's a unique constraint on submissionId + questionId
    // If not, we may need to check existence first and update/insert accordingly
    const [answer] = await db.insert(schema.questionAnswer).values(data).returning();
    if (!answer) {
      throw new Error('Failed to upsert question answer');
    }
    return answer;
  } catch (error) {
    throw new Error(`Failed to upsert question answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Updates a question answer
 * @param submissionId Submission ID
 * @param questionId Question ID
 * @param data Partial question answer data
 * @returns Updated question answer or null
 */
export async function updateQuestionAnswer(
  submissionId: string,
  questionId: number,
  data: Partial<TQuestionAnswer>
): Promise<TQuestionAnswer | null> {
  try {
    const [updated] = await db
      .update(schema.questionAnswer)
      .set(data)
      .where(
        and(eq(schema.questionAnswer.submissionId, submissionId), eq(schema.questionAnswer.questionId, questionId))
      )
      .returning();
    return updated || null;
  } catch (error) {
    throw new Error(`Failed to update question answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
