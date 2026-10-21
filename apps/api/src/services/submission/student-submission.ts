import { getExercise } from '@cio/core/services/exercise/exercise';
import { verifyExerciseBelongsToCourse } from '@cio/core/services/agent/chat-context';
import { getGroupMemberIdByCourseAndProfile } from '@cio/db/queries/group';
import { getSubmissionsByCourseIdWithDetails } from '@cio/db/queries/submission';

type StudentAnswerOption = { id: number | string; label: string | null };

export type StudentSubmissionReviewRequest = {
  courseId: string;
  profileId: string;
  exerciseId: string;
  attempt?: number;
};

/** Converts stored answer data into a safe learner-facing representation. */
function formatStudentAnswer(answerData: unknown, options: StudentAnswerOption[]) {
  if (!answerData || typeof answerData !== 'object' || !('type' in answerData)) return null;

  const answer = answerData as Record<string, unknown>;
  const optionLabelById = new Map(options.map((option) => [Number(option.id), option.label]));

  if (answer.type === 'RADIO' && typeof answer.optionId === 'number') {
    return optionLabelById.get(answer.optionId) ?? 'Selected option';
  }

  if (answer.type === 'CHECKBOX' && Array.isArray(answer.optionIds)) {
    return answer.optionIds.map((optionId) => optionLabelById.get(Number(optionId)) ?? 'Selected option');
  }

  if (answer.type === 'FILE_UPLOAD') {
    return typeof answer.fileName === 'string' ? answer.fileName : 'Uploaded file';
  }

  if (answer.type === 'VIDEO_RECORDING') {
    return typeof answer.fileName === 'string' ? answer.fileName : 'Recorded video';
  }

  const safeAnswer = { ...answer };
  delete safeAnswer.type;
  delete safeAnswer.fileKey;
  delete safeAnswer.storageKey;
  delete safeAnswer.playbackUrl;

  return safeAnswer;
}

/**
 * Returns a learner's own exercise result without answer keys or other learner data.
 */
export async function getStudentSubmissionReview({
  courseId,
  profileId,
  exerciseId,
  attempt
}: StudentSubmissionReviewRequest) {
  await verifyExerciseBelongsToCourse(exerciseId, courseId);

  const groupMemberId = await getGroupMemberIdByCourseAndProfile(courseId, profileId);
  if (!groupMemberId) {
    return { exerciseId, attemptCount: 0, submission: null };
  }

  const [exercise, submissions] = await Promise.all([
    getExercise(exerciseId),
    getSubmissionsByCourseIdWithDetails(courseId, exerciseId, groupMemberId)
  ]);
  const orderedSubmissions = [...submissions].sort(
    (left, right) => new Date(left.createdAt ?? 0).getTime() - new Date(right.createdAt ?? 0).getTime()
  );
  const selectedAttempt = attempt ?? orderedSubmissions.length;
  const submission = orderedSubmissions[selectedAttempt - 1];

  if (!submission) {
    return {
      exerciseId,
      exerciseTitle: exercise.title,
      attemptCount: orderedSubmissions.length,
      requestedAttempt: selectedAttempt,
      submission: null
    };
  }

  const isGraded = submission.gradingState === 'completed' || submission.statusId === 3;
  const answerByQuestionId = new Map((submission.answers ?? []).map((answer) => [answer.questionId, answer]));
  const orderedQuestions = [...(exercise.questions ?? [])].sort(
    (left, right) => Number(left.order ?? 0) - Number(right.order ?? 0)
  );
  const questions = orderedQuestions.map((question) => {
    const answer = answerByQuestionId.get(Number(question.id));
    const maxPoints = Number(question.points ?? 0);
    const earnedPoints = isGraded && answer?.point != null ? Number(answer.point) : null;
    const result =
      earnedPoints === null || maxPoints <= 0
        ? 'ungraded'
        : earnedPoints >= maxPoints
          ? 'correct'
          : earnedPoints > 0
            ? 'partially_correct'
            : 'incorrect';

    return {
      id: question.id,
      question: question.title,
      submittedAnswer: formatStudentAnswer(answer?.answerData, question.options ?? []),
      earnedPoints,
      maxPoints: isGraded ? maxPoints : null,
      result
    };
  });

  return {
    exerciseId,
    exerciseTitle: exercise.title,
    attemptCount: orderedSubmissions.length,
    selectedAttempt,
    submission: {
      id: submission.id,
      submittedAt: submission.createdAt,
      gradingState: submission.gradingState,
      graded: isGraded,
      score: isGraded ? Number(submission.total ?? 0) : null,
      maxScore: isGraded ? questions.reduce((total, question) => total + Number(question.maxPoints ?? 0), 0) : null,
      feedback: isGraded ? submission.feedback : null,
      questions
    }
  };
}
