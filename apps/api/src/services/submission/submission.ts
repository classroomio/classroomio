import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TNewSubmission, TSubmission } from '@cio/db/types';
import type { TSubmissionAnswerUpdate, TSubmissionUpdate } from '@cio/utils/validation/submission';
import {
  createSubmission,
  deleteSubmission,
  getQuestionAnswersBySubmissionId,
  getSubmissionById,
  getSubmissionsByCourseId,
  getSubmissionsByCourseIdWithDetails,
  getSubmissionsForGrading,
  updateQuestionAnswer,
  updateSubmission,
  upsertQuestionAnswer
} from '@cio/db/queries/submission';
import { getCourseById, getOrganizationByCourseId } from '@cio/db/queries/course';
import { getCourseTeachers, getProfileByGroupMemberId } from '@cio/db/queries/course/people';

import { db } from '@cio/db/drizzle';
import { buildEmailFromName, deliverEmail } from '@cio/email';
import { env } from '@api/config/env';
import { getExerciseById } from '@cio/db/queries/exercise';

/**
 * Gets a submission by ID with question answers
 * @param submissionId Submission ID
 * @returns Submission with question answers
 */
export async function getSubmission(submissionId: string): Promise<TSubmission & { answers?: any[] }> {
  try {
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      throw new AppError('Submission not found', ErrorCodes.SUBMISSION_NOT_FOUND, 404);
    }

    const answers = await getQuestionAnswersBySubmissionId(submissionId);

    return {
      ...submission,
      answers
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch submission',
      ErrorCodes.SUBMISSION_FETCH_FAILED,
      500
    );
  }
}

/**
 * Lists submissions for a course
 * @param courseId Course ID
 * @param exerciseId Optional exercise ID filter
 * @param submittedBy Optional group member ID filter
 * @returns Array of submissions with full details (answers, profile) when exerciseId is provided
 */
export async function listSubmissions(courseId: string, exerciseId?: string, submittedBy?: string) {
  try {
    // If exerciseId is provided, return full structure with answers and profile
    // Otherwise, return basic submission data
    if (exerciseId) {
      return await getSubmissionsByCourseIdWithDetails(courseId, exerciseId, submittedBy);
    }
    return await getSubmissionsByCourseId(courseId, exerciseId, submittedBy);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list submissions',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Lists submissions for grading with pre-processed data
 * @param courseId Course ID
 * @returns Processed submissions organized by status sections
 */
export async function listSubmissionsForGrading(courseId: string) {
  try {
    const rawSubmissions = await getSubmissionsForGrading(courseId);
    const course = await getCourseById(courseId);

    // Status mapping: 1 = submitted, 2 = in_progress, 3 = graded
    const statusMap: { [key: number]: string } = {
      1: 'Submitted',
      2: 'In Progress',
      3: 'Graded'
    };

    type SubmissionItem = {
      id: string;
      statusId: number;
      isEarly: boolean;
      feedback: string | null;
      submittedAt: string;
      exercise: {
        id: string;
        title: string;
      };
      answers: any[];
      student: any | null;
      lesson: {
        id: string;
        title: string;
      } | null;
    };

    const sections: Array<{ id: number; title: string; value: number; items: SubmissionItem[] }> = [
      { id: 1, title: statusMap[1], value: 0, items: [] },
      { id: 2, title: statusMap[2], value: 0, items: [] },
      { id: 3, title: statusMap[3], value: 0, items: [] }
    ];

    const submissionIdData: { [key: string]: any } = {};

    // Process each submission
    for (const submission of rawSubmissions) {
      const statusId = Number(submission.statusId);
      const isEarly = submission.exercise.dueBy
        ? new Date(submission.createdAt!).getTime() <= new Date(submission.exercise.dueBy).getTime()
        : true;

      const submittedAt = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium'
      }).format(new Date(submission.createdAt!));

      // Format answers
      const questionByIdAndName: { [id: number]: string } = {};
      for (const question of submission.exercise.questions || []) {
        questionByIdAndName[question.id] = question.name ?? '';
      }

      const formattedAnswers: { [questionName: string]: string | string[] } = {};
      const questionAnswerByPoint: { [questionId: number]: number } = {};

      for (const answer of submission.answers || []) {
        const questionName = questionByIdAndName[answer.questionId];
        if (questionName) {
          formattedAnswers[questionName] =
            Array.isArray(answer.answers) && answer.answers.length ? answer.answers : answer.openAnswer || '';
        }
        questionAnswerByPoint[answer.questionId] = answer.point || 0;
      }

      // Create submission item for sections
      const submissionItem = {
        id: submission.id,
        statusId,
        isEarly,
        feedback: submission.feedback,
        submittedAt,
        exercise: {
          id: submission.exercise.id,
          title: submission.exercise.title
        },
        answers: submission.answers || [],
        student: submission.groupmember?.profile || null,
        lesson: submission.lesson
          ? {
              id: submission.lesson.id,
              title: submission.lesson.title
            }
          : null
      };

      // Add to appropriate section
      const sectionIndex = statusId - 1;
      if (sectionIndex >= 0 && sectionIndex < sections.length) {
        sections[sectionIndex].items.push(submissionItem);
        sections[sectionIndex].value = sections[sectionIndex].items.length;
      }

      // Create detailed data for modal
      submissionIdData[submission.id] = {
        id: submission.id,
        statusId,
        feedback: submission.feedback,
        isEarly,
        title: submission.exercise.title,
        student: submission.groupmember?.profile || null,
        questions: (submission.exercise.questions || []).map((q: any) => ({
          id: q.id,
          title: q.title,
          name: q.name,
          order: q.order,
          points: q.points,
          questionTypeId: q.questionTypeId,
          options: (q.options || []).map((opt: any) => ({
            id: opt.id,
            value: opt.value,
            isCorrect: opt.isCorrect
          }))
        })),
        answers: formattedAnswers,
        questionAnswers: (submission.answers || []).map((answer: any) => ({
          questionId: answer.questionId,
          openAnswer: answer.openAnswer,
          answers: answer.answers || []
        })),
        questionAnswerByPoint
      };
    }

    return {
      sections,
      submissionIdData
    };
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list submissions for grading',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Creates a new submission with question answers
 * @param courseId Course ID
 * @param exerciseId Exercise ID
 * @param submittedBy Group member ID
 * @param answers Array of question answers
 * @returns Created submission
 */
export async function createSubmissionService(
  courseId: string,
  exerciseId: string,
  submittedBy: string,
  answers: Array<{ questionId: number; optionId?: number; answer?: string }>
): Promise<TSubmission> {
  try {
    const submissionData: TNewSubmission = {
      courseId,
      exerciseId,
      submittedBy,
      statusId: 1, // Default status (e.g., "submitted")
      total: 0 // Will be calculated during grading
    };

    const submission = await createSubmission(submissionData);

    // Create question answers
    if (answers.length > 0) {
      await db.transaction(async (tx) => {
        const answerPromises = answers.map((ans) =>
          upsertQuestionAnswer({
            submissionId: submission.id,
            questionId: ans.questionId,
            groupMemberId: submittedBy,
            // question_answer schema stores selected options as string[] and free-text as openAnswer
            answers: ans.optionId !== undefined ? [String(ans.optionId)] : [],
            openAnswer: ans.answer ?? ''
          })
        );

        await Promise.all(answerPromises);
      });
    }

    // Send email notification to teachers
    try {
      await sendExerciseSubmissionUpdateEmail(courseId, exerciseId, submittedBy);
    } catch (emailError) {
      // Log but don't fail the request if email fails
      console.error('Failed to send exercise submission update email:', emailError);
    }

    return submission;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create submission',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Updates a submission
 * @param submissionId Submission ID
 * @param data Partial submission update data
 * @returns Updated submission
 */
export async function updateSubmissionService(submissionId: string, data: TSubmissionUpdate): Promise<TSubmission> {
  try {
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      throw new AppError('Submission not found', ErrorCodes.SUBMISSION_NOT_FOUND, 404);
    }

    const statusChanged = data.statusId !== undefined && data.statusId !== submission.statusId;

    const updated = await updateSubmission(submissionId, data);
    if (!updated) {
      throw new AppError('Failed to update submission', ErrorCodes.INTERNAL_ERROR, 500);
    }

    // Send email notification if status changed
    if (statusChanged && data.statusId) {
      try {
        await sendSubmissionUpdateEmail(submissionId, data.statusId);
      } catch (emailError) {
        // Log but don't fail the request if email fails
        console.error('Failed to send submission update email:', emailError);
      }
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update submission',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Updates a question answer in a submission
 * @param submissionId Submission ID
 * @param questionId Question ID
 * @param data Question answer update data
 * @returns Updated question answer
 */
export async function updateSubmissionAnswer(
  submissionId: string,
  questionId: number,
  data: TSubmissionAnswerUpdate
): Promise<any> {
  try {
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      throw new AppError('Submission not found', ErrorCodes.SUBMISSION_NOT_FOUND, 404);
    }

    const updated = await updateQuestionAnswer(submissionId, questionId, data);
    if (!updated) {
      throw new AppError('Question answer not found', ErrorCodes.INTERNAL_ERROR, 404);
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update question answer',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Deletes a submission
 * @param submissionId Submission ID
 * @returns Deleted submission
 */
export async function deleteSubmissionService(submissionId: string): Promise<TSubmission> {
  try {
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      throw new AppError('Submission not found', ErrorCodes.SUBMISSION_NOT_FOUND, 404);
    }

    const deleted = await deleteSubmission(submissionId);
    if (!deleted) {
      throw new AppError('Failed to delete submission', ErrorCodes.INTERNAL_ERROR, 500);
    }

    return deleted;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete submission',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Sends email notification to student when submission status changes
 */
async function sendSubmissionUpdateEmail(submissionId: string, newStatusId: number) {
  const submission = await getSubmissionById(submissionId);
  if (!submission || !submission.courseId) {
    return;
  }

  const submissionData = await getSubmissionsForGrading(submission.courseId);
  const fullSubmission = submissionData.find((s) => s.id === submissionId);
  if (!fullSubmission || !fullSubmission.groupmember?.profile?.email) {
    return;
  }

  const courseResult = await getCourseById(fullSubmission.courseId || '');
  const course = courseResult[0];
  if (!course) {
    return;
  }

  // Get organization name
  const orgResult = await getOrganizationByCourseId(fullSubmission.courseId || '');

  const orgName = orgResult?.orgName || 'ClassroomIO';

  const statusMap: { [key: number]: string } = {
    1: 'Submitted',
    2: 'In Progress',
    3: 'Graded'
  };

  const statusText = statusMap[newStatusId] || 'Updated';
  const baseUrl = env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.classroomio.com';
  const exerciseLink = `${baseUrl}/courses/${fullSubmission.courseId}/exercises/${fullSubmission.exercise.id}`;

  // Calculate total and max points
  const answers = fullSubmission.answers || [];
  const totalMark = answers.reduce((sum: number, a: any) => sum + (a.point || 0), 0);
  const maxMark = (fullSubmission.exercise.questions || []).reduce((sum: number, q: any) => sum + (q.points || 0), 0);

  let content = `
    <p>Hello ${fullSubmission.groupmember.profile.fullname || 'Student'},</p>
    <p>The status of your submitted exercise on <strong>${fullSubmission.exercise.title}</strong> has been updated to ${statusText}</p>
  `;

  if (newStatusId === 3) {
    content += `
      <p>Your score was ${totalMark}/${maxMark}</p>
      <a class="button" href="${exerciseLink}">View your Result</a>
    `;
  } else {
    content += `<a class="button" href="${exerciseLink}">Open Exercise</a>`;
  }

  if (fullSubmission.lesson?.title) {
    content += `
      <p>This exercise is for <strong>${fullSubmission.lesson.title}</strong> in a course you are taking titled <strong>${course.title}</strong></p>
    `;
  } else {
    content += `
      <p>This exercise is in a course you are taking titled <strong>${course.title}</strong></p>
    `;
  }

  await deliverEmail([
    {
      from: buildEmailFromName(`${orgName} (via ClassroomIO.com)`),
      to: fullSubmission.groupmember.profile.email,
      subject: 'Submission Update',
      content
    }
  ]);
}

/**
 * Sends email notification to teachers when a student submits an exercise
 */
async function sendExerciseSubmissionUpdateEmail(courseId: string, exerciseId: string, submittedBy: string) {
  // Get course and exercise data
  const course = await getCourseById(courseId);
  if (!course) {
    return;
  }

  const exercise = await getExerciseById(exerciseId);

  if (!exercise) {
    return;
  }

  // Get student info
  const student = await getProfileByGroupMemberId(submittedBy);

  if (!student) {
    return;
  }

  // Get tutors (ADMIN or TUTOR role) from the course's group
  const tutorsResult = await getCourseTeachers({ courseId });

  if (tutorsResult.length === 0) {
    return;
  }

  // Get organization name
  const orgResult = await getOrganizationByCourseId(courseId);

  const orgName = orgResult?.orgName || 'ClassroomIO';

  const baseUrl = env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.classroomio.com';
  const exerciseLink = `${baseUrl}/courses/${courseId}/exercises/${exerciseId}`;
  const submissionLink = `${baseUrl}/courses/${courseId}/submissions`;

  const content = `
    <p>Hello,</p>
    <p>A student ${student.fullname || student.username} just submitted an exercise <a href="${exerciseLink}">${exercise.title}</a></p>
    <p>You can get started grading by clicking "Open Submissions"</p>
    <div>
      <a class="button" href="${submissionLink}">Open Submissions</a>
    </div>
  `;

  // Send email to all tutors
  const emailPromises = tutorsResult.map((tutor) => {
    if (!tutor.email) return Promise.resolve();
    return deliverEmail([
      {
        from: buildEmailFromName(`${orgName} (via ClassroomIO.com)`),
        to: tutor.email,
        subject: `[Submitted]: ${exercise.title}`,
        content
      }
    ]);
  });

  await Promise.all(emailPromises);
}
