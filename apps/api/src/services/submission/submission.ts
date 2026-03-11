import type { AnswerData, FileUploadAnswerData } from '@cio/question-types';
import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TNewSubmission, TSubmission } from '@cio/db/types';
import type {
  TSubmissionAnswerUpdate,
  TSubmissionGradesUpdate,
  TSubmissionUpdate
} from '@cio/utils/validation/submission';
import { buildEmailFromName, deliverEmail } from '@cio/email';
import {
  createSubmission,
  deleteSubmission,
  getQuestionAnswersBySubmissionId,
  getSubmissionById,
  getSubmissionsByCourseIdWithDetails,
  getSubmissionsForGrading,
  updateQuestionAnswer,
  updateSubmission,
  updateSubmissionGrades,
  upsertQuestionAnswer
} from '@cio/db/queries/submission';
import {
  fromApiPayload,
  getQuestionTypeById,
  getQuestionTypeByTypename,
  requiresManualGrading
} from '@cio/question-types';
import { getCourseById, getOrganizationByCourseId } from '@cio/db/queries/course';
import { getCourseTeachers, getProfileByGroupMemberId } from '@cio/db/queries/course/people';
import { getExerciseById, getExerciseWithRelationsOptimized } from '@cio/db/queries/exercise';
import { getGroupMemberIdByCourseAndProfile, isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';

import { QUESTION_TYPE_ID_TO_KEY } from '@cio/question-types';
import { db } from '@cio/db/drizzle';
import { getDashboardBaseUrl } from '@api/config/dashboard-url';
import { generateDocumentDownloadPresignedUrls } from '@api/utils/s3';

type SubmissionGradingState = 'queued' | 'processing' | 'awaiting_manual' | 'completed' | 'failed';
type SubmissionOverallStatus = 'auto_graded' | 'manual_required' | 'hybrid';

const LEGACY_BOARD_STATUS_LABELS: Record<number, string> = {
  1: 'Submitted',
  2: 'In Progress',
  3: 'Graded'
};

const LEGACY_STATUS_TO_GRADING_STATE: Record<number, SubmissionGradingState> = {
  1: 'queued',
  2: 'processing',
  3: 'completed'
};

const GRADING_STATE_TO_LEGACY_STATUS: Record<SubmissionGradingState, number> = {
  queued: 1,
  processing: 2,
  awaiting_manual: 2,
  failed: 2,
  completed: 3
};

const ALLOWED_GRADING_TRANSITIONS: Record<SubmissionGradingState, SubmissionGradingState[]> = {
  queued: ['processing'],
  processing: ['completed', 'awaiting_manual', 'failed'],
  awaiting_manual: ['completed'],
  failed: ['queued'],
  completed: []
};

function projectLegacyStatusId(gradingState: SubmissionGradingState): number {
  return GRADING_STATE_TO_LEGACY_STATUS[gradingState];
}

function resolveSubmissionGradingState(submission: Partial<TSubmission>): SubmissionGradingState {
  const rawState = typeof submission.gradingState === 'string' ? submission.gradingState : '';
  if (rawState && rawState in GRADING_STATE_TO_LEGACY_STATUS) {
    return rawState as SubmissionGradingState;
  }

  const legacyStatusId = Number(submission.statusId ?? 1);
  return LEGACY_STATUS_TO_GRADING_STATE[legacyStatusId] ?? 'queued';
}

function resolveOverallStatusFromTypenames(typenames: string[]): SubmissionOverallStatus {
  const manualFlags = typenames.map((typename) => {
    const metadata = getQuestionTypeByTypename(typename);
    if (!metadata) return true;
    return requiresManualGrading(metadata.key);
  });

  const hasManual = manualFlags.some(Boolean);
  const hasAuto = manualFlags.some((value) => !value);

  if (hasManual && hasAuto) return 'hybrid';
  if (hasManual) return 'manual_required';
  return 'auto_graded';
}

function resolveOverallStatusFromQuestionTypeIds(questionTypeIds: number[]): SubmissionOverallStatus {
  const manualFlags = questionTypeIds.map((questionTypeId) => {
    const metadata = getQuestionTypeById(questionTypeId);
    if (!metadata) return true;
    return requiresManualGrading(metadata.key);
  });

  const hasManual = manualFlags.some(Boolean);
  const hasAuto = manualFlags.some((value) => !value);

  if (hasManual && hasAuto) return 'hybrid';
  if (hasManual) return 'manual_required';
  return 'auto_graded';
}

function resolveRequestedGradingState(data: TSubmissionUpdate): SubmissionGradingState | null {
  if (data.gradingState) {
    return data.gradingState;
  }

  if (data.statusId === undefined) {
    return null;
  }

  const mapped = LEGACY_STATUS_TO_GRADING_STATE[Number(data.statusId)];
  if (!mapped) {
    throw new AppError('Invalid submission status', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return mapped;
}

function isAllowedGradingTransition(from: SubmissionGradingState, to: SubmissionGradingState): boolean {
  if (from === to) return true;
  return ALLOWED_GRADING_TRANSITIONS[from]?.includes(to) ?? false;
}

function isFileUpload(data: unknown): data is FileUploadAnswerData {
  return !!data && typeof data === 'object' && (data as { type: string }).type === 'FILE_UPLOAD';
}

/**
 * Enriches FILE_UPLOAD answers from DB rows (question_answer[]) with presigned download URLs.
 * Used by getSubmission and listSubmissionsByExercise.
 */
async function enrichFileUploadAnswersArray<T extends { answerData?: unknown }>(answers: T[]): Promise<T[]> {
  const fileKeys = answers
    .map((a) => a.answerData)
    .filter(isFileUpload)
    .map((d) => d.fileKey);

  if (fileKeys.length === 0) return answers;

  try {
    const urls = await generateDocumentDownloadPresignedUrls(fileKeys);
    return answers.map((answer) => {
      if (!isFileUpload(answer.answerData)) return answer;
      const url = urls[answer.answerData.fileKey];
      return url ? { ...answer, answerData: { ...answer.answerData, fileUrl: url } } : answer;
    });
  } catch (error) {
    console.error('enrichFileUploadAnswersArray error:', error);
    return answers;
  }
}

/**
 * Enriches FILE_UPLOAD entries in a { questionName → AnswerData } map with presigned download URLs.
 * Used by getSubmissionsForGradingEmail to build the grading email payload.
 */
async function enrichFileUploadAnswersObject(answers: Record<string, AnswerData>): Promise<Record<string, AnswerData>> {
  const fileKeys = Object.values(answers)
    .filter(isFileUpload)
    .map((d) => d.fileKey);

  if (fileKeys.length === 0) return answers;

  try {
    const urls = await generateDocumentDownloadPresignedUrls(fileKeys);
    return Object.fromEntries(
      Object.entries(answers).map(([key, data]) => {
        if (!isFileUpload(data)) return [key, data];
        const url = urls[data.fileKey];
        return url ? [key, { ...data, fileUrl: url }] : [key, data];
      })
    );
  } catch (error) {
    console.error('enrichFileUploadAnswersObject error:', error);
    return answers;
  }
}

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

    let answers = await getQuestionAnswersBySubmissionId(submissionId);
    if (answers.length > 0) {
      answers = await enrichFileUploadAnswersArray(answers);
    }

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

/** Submission with answers + groupmember (when listing by exercise). Used for route typing. */
type SubmissionWithDetails = Awaited<ReturnType<typeof getSubmissionsByCourseIdWithDetails>>[number];

/**
 * Lists submissions for a course filtered by exercise (with answers, groupmember, enriched file URLs)
 * @param courseId Course ID
 * @param exerciseId Exercise ID (required)
 * @param submittedBy Optional group member ID filter
 */
export async function listSubmissionsByExercise(
  courseId: string,
  exerciseId: string,
  submittedBy?: string
): Promise<SubmissionWithDetails[]> {
  try {
    const submissions = await getSubmissionsByCourseIdWithDetails(courseId, exerciseId, submittedBy);
    const enriched = await Promise.all(
      submissions.map(async (s) =>
        s.answers?.length ? { ...s, answers: await enrichFileUploadAnswersArray(s.answers) } : s
      )
    );
    return enriched;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list submissions by exercise',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export type ExerciseSubmissionsOverview = {
  mySubmission: Awaited<ReturnType<typeof listSubmissionsByExercise>>;
  allSubmissions: Awaited<ReturnType<typeof listSubmissionsByExercise>>;
};

/**
 * Returns submission overview for an exercise based on user role.
 * - Students: mySubmission = their submission(s), allSubmissions = []
 * - Instructors: mySubmission = [], allSubmissions = all submissions in exercise
 */
export async function listExerciseSubmissionsOverview(
  courseId: string,
  exerciseId: string,
  profileId: string
): Promise<ExerciseSubmissionsOverview> {
  try {
    const [groupMemberId, isInstructor] = await Promise.all([
      getGroupMemberIdByCourseAndProfile(courseId, profileId),
      isCourseTeamMemberOrOrgAdmin(courseId, profileId)
    ]);

    if (isInstructor) {
      const allSubmissions = await listSubmissionsByExercise(courseId, exerciseId);
      return { mySubmission: [], allSubmissions };
    }

    const mySubmission = groupMemberId ? await listSubmissionsByExercise(courseId, exerciseId, groupMemberId) : [];

    return { mySubmission, allSubmissions: [] };
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list exercise submissions overview',
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

    type SubmissionItem = {
      id: string;
      statusId: number;
      gradingState: SubmissionGradingState;
      overallStatus: SubmissionOverallStatus;
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
      { id: 1, title: LEGACY_BOARD_STATUS_LABELS[1], value: 0, items: [] },
      { id: 2, title: LEGACY_BOARD_STATUS_LABELS[2], value: 0, items: [] },
      { id: 3, title: LEGACY_BOARD_STATUS_LABELS[3], value: 0, items: [] }
    ];

    const submissionIdData: { [key: string]: any } = {};

    // Process each submission
    for (const submission of rawSubmissions) {
      const gradingState = resolveSubmissionGradingState(submission);
      const statusId = projectLegacyStatusId(gradingState);
      const storedOverallStatus = typeof submission.overallStatus === 'string' ? submission.overallStatus : '';
      const fallbackOverallStatus = resolveOverallStatusFromQuestionTypeIds(
        (submission.exercise.questions || [])
          .map((question: any) => Number(question.questionTypeId))
          .filter((questionTypeId: number) => Number.isFinite(questionTypeId))
      );
      const overallStatus: SubmissionOverallStatus =
        storedOverallStatus === 'auto_graded' ||
        storedOverallStatus === 'manual_required' ||
        storedOverallStatus === 'hybrid'
          ? (storedOverallStatus as SubmissionOverallStatus)
          : fallbackOverallStatus;
      const isEarly = submission.exercise.dueBy
        ? new Date(submission.createdAt!).getTime() <= new Date(submission.exercise.dueBy).getTime()
        : true;

      const submittedAt = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium'
      }).format(new Date(submission.createdAt!));

      // Format answers
      const questionByIdAndName: { [id: number]: string } = {};
      const questionTypeById: { [id: number]: number } = {};
      for (const question of submission.exercise.questions || []) {
        questionByIdAndName[question.id] = question.name ?? '';
        questionTypeById[question.id] = question.questionTypeId;
      }

      const formattedAnswers: { [questionName: string]: AnswerData } = {};
      const questionAnswerByPoint: { [questionId: number]: number } = {};

      for (const answer of submission.answers || []) {
        const questionName = questionByIdAndName[answer.questionId];
        if (
          questionName &&
          answer.answerData &&
          typeof answer.answerData === 'object' &&
          answer.answerData !== null &&
          'type' in answer.answerData
        ) {
          formattedAnswers[questionName] = answer.answerData as AnswerData;
        }
        questionAnswerByPoint[answer.questionId] = answer.point || 0;
      }

      const enrichedFormattedAnswers = await enrichFileUploadAnswersObject(formattedAnswers);

      // Create submission item for sections
      const submissionItem = {
        id: submission.id,
        statusId,
        gradingState,
        overallStatus,
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
        gradingState,
        overallStatus,
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
          settings: q.settings ?? {},
          options: (q.options || []).map((opt: any) => ({
            id: opt.id,
            label: opt.label,
            value: opt.value,
            isCorrect: opt.isCorrect,
            settings: opt.settings ?? {}
          }))
        })),
        answers: enrichedFormattedAnswers,
        questionAnswers: (submission.answers || []).map((answer: any) => ({
          questionId: answer.questionId,
          answerData: answer.answerData
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
    const exerciseWithRelations = await getExerciseWithRelationsOptimized(exerciseId);
    const overallStatus = resolveOverallStatusFromTypenames(
      exerciseWithRelations.questions
        .map((question) => question.questionType?.typename ?? '')
        .filter((typename) => typename.length > 0)
    );
    const gradingState: SubmissionGradingState = 'queued';

    const submissionData: TNewSubmission = {
      courseId,
      exerciseId,
      submittedBy,
      statusId: projectLegacyStatusId(gradingState),
      gradingState,
      overallStatus,
      total: 0 // Will be calculated during grading
    };

    const submission = await createSubmission(submissionData);

    // Create question answers
    if (answers.length > 0) {
      const questionById = new Map(
        exerciseWithRelations.questions.map((q) => {
          const questionTypeKey = QUESTION_TYPE_ID_TO_KEY[q.questionTypeId] ?? 'TEXTAREA';
          return [
            q.id,
            {
              id: q.id,
              title: q.title ?? '',
              questionType: questionTypeKey,
              options: (q.options ?? []).map((o) => ({
                id: o.id,
                label: o.label ?? '',
                value: o.value ?? undefined,
                isCorrect: o.isCorrect
              }))
            }
          ];
        })
      );

      await db.transaction(async () => {
        for (const ans of answers) {
          const question = questionById.get(ans.questionId);
          if (!question) continue;

          const answerData = fromApiPayload(
            question.questionType,
            { questionId: ans.questionId, optionId: ans.optionId, answer: ans.answer },
            question
          );
          if (!answerData) continue;

          await upsertQuestionAnswer({
            submissionId: submission.id,
            questionId: ans.questionId,
            groupMemberId: submittedBy,
            answerData
          });
        }
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

    const currentGradingState = resolveSubmissionGradingState(submission);
    const requestedGradingState = resolveRequestedGradingState(data);
    if (requestedGradingState && !isAllowedGradingTransition(currentGradingState, requestedGradingState)) {
      throw new AppError('Invalid submission workflow transition', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const previousLegacyStatusId = projectLegacyStatusId(currentGradingState);
    const updatePayload: Partial<TSubmission> = { ...data };
    if (requestedGradingState) {
      updatePayload.gradingState = requestedGradingState;
      updatePayload.statusId = projectLegacyStatusId(requestedGradingState);
    }

    const nextLegacyStatusId = Number(updatePayload.statusId ?? previousLegacyStatusId);
    const statusChanged = nextLegacyStatusId !== previousLegacyStatusId;

    const updated = await updateSubmission(submissionId, updatePayload);
    if (!updated) {
      throw new AppError('Failed to update submission', ErrorCodes.INTERNAL_ERROR, 500);
    }

    // Send email notification if status changed
    if (statusChanged) {
      try {
        await sendSubmissionUpdateEmail(submissionId, nextLegacyStatusId);
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

    const updateData: { point?: number } = {};
    if (data.points !== undefined) updateData.point = data.points;
    if (Object.keys(updateData).length === 0) return null;

    const updated = await updateQuestionAnswer(submissionId, questionId, updateData);
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
 * Updates all question answer points and submission total/feedback in a single transaction.
 * Submitting grades automatically transitions status to Graded (statusId 3, gradingState completed).
 */
export async function updateSubmissionGradesBatch(
  submissionId: string,
  data: TSubmissionGradesUpdate
): Promise<TSubmission> {
  try {
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      throw new AppError('Submission not found', ErrorCodes.SUBMISSION_NOT_FOUND, 404);
    }

    const currentGradingState = resolveSubmissionGradingState(submission);
    const targetGradingState: SubmissionGradingState = 'completed';
    const targetStatusId = projectLegacyStatusId(targetGradingState);

    if (!isAllowedGradingTransition(currentGradingState, targetGradingState)) {
      throw new AppError('Invalid submission workflow transition', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const previousLegacyStatusId = projectLegacyStatusId(currentGradingState);
    const statusChanged = targetStatusId !== previousLegacyStatusId;

    const updated = await updateSubmissionGrades(submissionId, {
      answers: data.answers,
      total: data.total,
      feedback: data.feedback,
      statusId: targetStatusId,
      gradingState: targetGradingState
    });

    if (!updated) {
      throw new AppError('Failed to update grades', ErrorCodes.INTERNAL_ERROR, 500);
    }

    if (statusChanged) {
      try {
        await sendSubmissionUpdateEmail(submissionId, targetStatusId);
      } catch (emailError) {
        console.error('Failed to send submission update email:', emailError);
      }
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update submission grades',
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

  const statusText = LEGACY_BOARD_STATUS_LABELS[newStatusId] || 'Updated';
  const baseUrl = getDashboardBaseUrl();
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

  const baseUrl = getDashboardBaseUrl();
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
