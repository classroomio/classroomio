import { generateObject } from 'ai';
import { getOrgIdByCourseId } from '@cio/db/queries/course';
import {
  getAnswerForAiReview,
  getAnswersWithAiReviewByExercise,
  getAnswersWithQuestionBySubmissionId,
  setAnswerAiReview,
  updateSubmissionGrades,
  type AnswerForAiReview
} from '@cio/db/queries/submission';
import { generateDocumentDownloadPresignedUrls } from '@cio/core/utils/s3';
import {
  AI_REVIEW_CONFIDENT_THRESHOLD,
  QUESTION_TYPE_IDS,
  getQuestionTypeById,
  getWorkedSolutionPointSplit,
  isAiGradingEnabled,
  isBulkAcceptable,
  normaliseAiReview,
  readMarkingRubric,
  roundPoints,
  type AiReview,
  type AnswerData
} from '@cio/question-types';
import { checkMathSteps } from '@cio/question-types/math-grading';
import type { MathStepsCheck } from '@cio/question-types/math-steps';
import { instantiateQuestion } from '@cio/question-types/variants';
import { ZAiReviewModelOutput, type TAiReviewDecisionBody } from '@cio/utils/validation/math';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { enforceMathVisionAllowance, recordMathVisionUsage } from '@api/services/math/vision-usage';
import { getVisionModel, getVisionProviderOptions } from '@api/services/math/vision-model';
import { updateSubmissionGradesBatch } from './submission';

const WORKED_SOLUTION_TYPE_ID: number = QUESTION_TYPE_IDS.WORKED_SOLUTION;
const TEXTAREA_TYPE_ID: number = QUESTION_TYPE_IDS.TEXTAREA;
const MAX_WORKING_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const SYSTEM_PROMPT = [
  'You are a marking assistant for a math teacher. You suggest marks; the teacher decides.',
  'Mark the student working against the rubric steps only. Award each step between 0 and its points, using partial points when a step is partly done.',
  'Never solve the problem to find a mistake yourself. The engine notes below come from a Compute Engine and are authoritative about typed steps and the final answer; when they say a line does not follow from the line before it, treat that as the first wrong step unless the rubric says otherwise.',
  'Read handwriting carefully. If a part is unreadable, award nothing for it, say so in the comment and lower your confidence below 0.6.',
  'Write the comment for the teacher in two sentences at most. Do not address the student and do not give the full solution.',
  'Return the first rubric step that is wrong or missing in firstWrongStep, or null when every step is right.'
].join(' ');

export type WorkingEvidence = {
  finalAnswer: string | null;
  finalAnswerReason: string | null;
  typedLines: string[];
  text: string | null;
  imageKeys: string[];
  engineCheck: MathStepsCheck | null;
};

function htmlToPlainText(html: string): string {
  return html
    .replace(/<span[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/span>/g, ' $$$1$$ ')
    .replace(/<div[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/div>/g, ' $$$$$1$$$$ ')
    .replace(/<br\s*\/?>|<\/p>|<\/li>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/** What the reviewer is shown for one answer, plus the engine's verdict on any typed lines. */
export function collectWorkingEvidence(answer: AnswerData): WorkingEvidence {
  if (answer.type === 'WORKED_SOLUTION') {
    const typedLines = answer.working.lines.map((line) => line.trim()).filter(Boolean);

    return {
      finalAnswer: answer.latex.trim() || null,
      finalAnswerReason: answer.grading?.reason ?? null,
      typedLines,
      text: null,
      imageKeys: answer.working.files.map((file) => file.fileKey).slice(0, MAX_WORKING_IMAGES),
      engineCheck: typedLines.length > 0 ? checkMathSteps(typedLines) : null
    };
  }

  const text = answer.type === 'TEXTAREA' ? htmlToPlainText(answer.text) : '';

  return {
    finalAnswer: null,
    finalAnswerReason: null,
    typedLines: [],
    text: text || null,
    imageKeys: [],
    engineCheck: null
  };
}

export function describeEvidence(evidence: WorkingEvidence): string {
  const lines: string[] = [];
  if (evidence.finalAnswer) {
    const verdict = evidence.finalAnswerReason ? ' (engine verdict: ' + evidence.finalAnswerReason + ')' : '';
    lines.push('Final answer: ' + evidence.finalAnswer + verdict);
  }
  if (evidence.typedLines.length > 0) {
    lines.push('Typed working, one line per step:');
    evidence.typedLines.forEach((line, index) => {
      const status = evidence.engineCheck?.steps[index]?.status;
      lines.push('Line ' + (index + 1) + ': ' + line + (status ? ' [engine: ' + status + ']' : ''));
    });
  }
  if (evidence.text) lines.push('Written answer:\n' + evidence.text);
  if (evidence.imageKeys.length > 0) lines.push('The working is also in the attached image(s).');

  return lines.join('\n');
}

/**
 * The engine outranks the model on typed math: when a typed line does not follow from the one before it but the model
 * found no wrong step, the suggestion is kept but its confidence drops so it never qualifies for bulk accept.
 */
export function reconcileWithEngine(review: AiReview, engineCheck: MathStepsCheck | null): AiReview {
  if (!engineCheck || engineCheck.firstIncorrectIndex === null || review.firstWrongStep !== null) return review;

  const note =
    'The engine found that line ' + (engineCheck.firstIncorrectIndex + 1) + ' does not follow from the line before it.';

  return { ...review, confidence: Math.min(review.confidence, 0.4), comment: (review.comment + ' ' + note).trim() };
}

async function loadWorkingImages(keys: string[]) {
  if (keys.length === 0) return [];

  const urls = await generateDocumentDownloadPresignedUrls(keys);
  const images = await Promise.all(
    keys.map(async (key) => {
      const url = urls[key];
      if (!url) return null;

      const response = await fetch(url);
      if (!response.ok) return null;

      const mediaType = response.headers.get('content-type')?.split(';')[0] ?? 'image/png';
      const data = new Uint8Array(await response.arrayBuffer());
      if (!mediaType.startsWith('image/') || data.byteLength > MAX_IMAGE_BYTES) return null;

      return { type: 'image' as const, image: data, mediaType };
    })
  );

  return images.filter((image) => image !== null);
}

function assertReviewable(row: AnswerForAiReview | null, courseId: string): asserts row is AnswerForAiReview {
  if (!row || row.courseId !== courseId) {
    throw new AppError('Answer not found', ErrorCodes.NOT_FOUND, 404);
  }
  if (row.questionTypeId !== WORKED_SOLUTION_TYPE_ID && row.questionTypeId !== TEXTAREA_TYPE_ID) {
    throw new AppError('Only worked solutions and paragraph answers can be reviewed', ErrorCodes.VALIDATION_ERROR, 400);
  }
}

function readSettings(row: AnswerForAiReview): Record<string, unknown> {
  return (row.questionSettings as Record<string, unknown> | null) ?? {};
}

function maxWorkingPoints(row: AnswerForAiReview): number {
  const points = Number(row.questionPoints ?? 0);
  if (row.questionTypeId === TEXTAREA_TYPE_ID) return points;

  return getWorkedSolutionPointSplit(readSettings(row), points).workingPoints;
}

/**
 * Asks a vision model to mark one answer's working against the teacher's rubric and stores the result as a suggestion in
 * answer_data.aiReview. Nothing changes the student's grade until a teacher accepts it.
 */
export async function requestAiReview(params: {
  courseId: string;
  submissionId: string;
  questionId: number;
  userId: string;
}): Promise<AiReview> {
  const row = await getAnswerForAiReview(params.submissionId, params.questionId);
  assertReviewable(row, params.courseId);

  const answer = row.answerData as AnswerData | null;
  if (!answer || (answer.type !== 'WORKED_SOLUTION' && answer.type !== 'TEXTAREA')) {
    throw new AppError('This answer has no working to review', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const storedSettings = readSettings(row);
  if (!isAiGradingEnabled(storedSettings)) {
    throw new AppError('AI suggestions are not turned on for this question', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const question = instantiateQuestion(
    { title: row.questionTitle, settings: storedSettings },
    answer.seed ?? 'default'
  );
  const rubric = readMarkingRubric(question.settings);
  const evidence = collectWorkingEvidence(answer);
  const images = await loadWorkingImages(evidence.imageKeys);
  if (!evidence.finalAnswer && evidence.typedLines.length === 0 && !evidence.text && images.length === 0) {
    throw new AppError('The student did not show any working', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const orgId = await getOrgIdByCourseId(params.courseId);
  if (!orgId) throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);

  await enforceMathVisionAllowance(orgId);

  const { provider, model, modelName } = getVisionModel();
  const rubricText = rubric.steps
    .map((step) => 'id=' + step.id + ' (' + step.points + ' points): ' + step.description)
    .join('\n');
  const prompt = [
    'Question: ' + (question.title ?? ''),
    'Rubric steps:\n' + rubricText,
    describeEvidence(evidence)
  ].join('\n\n');

  const { object, usage } = await generateObject({
    model,
    schema: ZAiReviewModelOutput,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, ...images] }],
    maxOutputTokens: 1500,
    maxRetries: 0,
    providerOptions: getVisionProviderOptions(provider)
  });

  await recordMathVisionUsage(
    orgId,
    params.userId,
    params.courseId,
    { promptTokens: usage.inputTokens ?? 0, completionTokens: usage.outputTokens ?? 0 },
    modelName
  );

  const normalised = normaliseAiReview(
    {
      stepMarks: object.stepMarks.map((mark) => ({ ...mark, comment: mark.comment ?? undefined })),
      firstWrongStep: object.firstWrongStep,
      comment: object.comment,
      confidence: object.confidence
    },
    rubric,
    { model: modelName, reviewedAt: new Date().toISOString(), maxPoints: maxWorkingPoints(row) }
  );
  const review = reconcileWithEngine(normalised, evidence.engineCheck);

  await setAnswerAiReview(row.answerId, review);

  return review;
}

/** Records what the teacher did with a suggestion; the grade itself is saved through the normal grading route. */
export async function recordAiReviewDecision(params: {
  courseId: string;
  submissionId: string;
  actorProfileId: string;
  decision: TAiReviewDecisionBody;
}): Promise<AiReview> {
  const row = await getAnswerForAiReview(params.submissionId, params.decision.questionId);
  assertReviewable(row, params.courseId);

  const stored = (row.answerData as AnswerData | null)?.aiReview;
  if (!stored) throw new AppError('There is no AI suggestion to decide on', ErrorCodes.NOT_FOUND, 404);

  const updated: AiReview = {
    ...stored,
    decision: {
      status: params.decision.status,
      decidedAt: new Date().toISOString(),
      decidedBy: params.actorProfileId,
      ...(params.decision.awardedPoints !== undefined ? { awardedPoints: params.decision.awardedPoints } : {})
    }
  };
  await setAnswerAiReview(row.answerId, updated);

  return updated;
}

function needsTeacher(row: AnswerForAiReview): boolean {
  return (
    row.questionTypeId === WORKED_SOLUTION_TYPE_ID ||
    getQuestionTypeById(row.questionTypeId)?.manualGradingRequired === true
  );
}

function isDecided(answerData: AnswerData | null): boolean {
  const status = answerData?.aiReview?.decision?.status;

  return status === 'accepted' || status === 'edited';
}

export type BulkAcceptResult = {
  acceptedCount: number;
  completedSubmissionIds: string[];
  accepted: Array<{
    submissionId: string;
    questionId: number;
    points: number;
    decision: NonNullable<AiReview['decision']>;
  }>;
};

/**
 * Accepts every undecided suggestion at or above ${minConfidence} in an exercise that is still awaiting manual grading.
 * A submission whose every manually graded answer is then accepted is graded, which releases it to the student.
 */
export async function bulkAcceptAiReviews(params: {
  courseId: string;
  exerciseId: string;
  actorProfileId: string;
  minConfidence?: number;
}): Promise<BulkAcceptResult> {
  const rows = await getAnswersWithAiReviewByExercise(params.exerciseId);
  const threshold = params.minConfidence ?? AI_REVIEW_CONFIDENT_THRESHOLD;
  const acceptable = rows.filter(
    (row) =>
      row.courseId === params.courseId &&
      row.gradingState === 'awaiting_manual' &&
      isBulkAcceptable((row.answerData as AnswerData | null)?.aiReview, threshold)
  );

  const rowsBySubmission = new Map<string, AnswerForAiReview[]>();
  for (const row of acceptable) {
    if (!row.submissionId) continue;
    rowsBySubmission.set(row.submissionId, [...(rowsBySubmission.get(row.submissionId) ?? []), row]);
  }

  const acceptedAnswers: BulkAcceptResult['accepted'] = [];
  const completedSubmissionIds: string[] = [];

  for (const [submissionId, accepted] of rowsBySubmission) {
    const allAnswers = await getAnswersWithQuestionBySubmissionId(submissionId);
    const pointByQuestionId = new Map(allAnswers.map((row) => [row.questionId, Number(row.point ?? 0)]));
    const acceptedQuestionIds = new Set(accepted.map((row) => row.questionId));
    const decidedAt = new Date().toISOString();

    for (const row of accepted) {
      const review = (row.answerData as AnswerData).aiReview!;
      const maxPoints = Number(row.questionPoints ?? 0);
      const nextPoints = roundPoints(Math.min(maxPoints, Number(row.point ?? 0) + review.suggestedPoints));
      pointByQuestionId.set(row.questionId, nextPoints);

      const decision = {
        status: 'accepted' as const,
        decidedAt,
        decidedBy: params.actorProfileId,
        awardedPoints: review.suggestedPoints
      };
      await setAnswerAiReview(row.answerId, { ...review, decision });
      acceptedAnswers.push({ submissionId, questionId: row.questionId, points: nextPoints, decision });
    }

    const isComplete = allAnswers
      .filter(needsTeacher)
      .every((row) => acceptedQuestionIds.has(row.questionId) || isDecided(row.answerData as AnswerData | null));
    const total = roundPoints([...pointByQuestionId.values()].reduce((sum, points) => sum + points, 0));
    const gradedAnswers = accepted.map((row) => ({
      questionId: row.questionId,
      points: pointByQuestionId.get(row.questionId) ?? 0
    }));

    if (isComplete) {
      await updateSubmissionGradesBatch(
        submissionId,
        params.courseId,
        { answers: gradedAnswers, total },
        { actorProfileId: params.actorProfileId }
      );
      completedSubmissionIds.push(submissionId);
      continue;
    }

    await updateSubmissionGrades(submissionId, { answers: gradedAnswers, total });
  }

  return { acceptedCount: acceptedAnswers.length, completedSubmissionIds, accepted: acceptedAnswers };
}
