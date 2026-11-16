import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('ai', () => ({ generateObject: vi.fn() }));
vi.mock('@cio/db/queries/course', () => ({ getOrgIdByCourseId: vi.fn() }));
vi.mock('@cio/core/services/agent/usage', () => ({ isOrgOnPaidPlan: vi.fn() }));
vi.mock('@cio/db/queries/submission', () => ({
  getAnswerForAiReview: vi.fn(),
  getAnswersWithAiReviewByExercise: vi.fn(),
  getAnswersWithQuestionBySubmissionId: vi.fn(),
  setAnswerAiReview: vi.fn(),
  updateSubmissionGrades: vi.fn()
}));
vi.mock('@cio/core/utils/s3', () => ({ generateDocumentDownloadPresignedUrls: vi.fn().mockResolvedValue({}) }));
vi.mock('@api/services/math/vision-usage', () => ({
  enforceMathVisionAllowance: vi.fn(),
  recordMathVisionUsage: vi.fn()
}));
vi.mock('@api/services/math/vision-model', () => ({
  getVisionModel: vi.fn(() => ({ provider: 'google', model: {}, modelName: 'mock-vision' })),
  getVisionProviderOptions: vi.fn()
}));
vi.mock('@api/services/submission/submission', () => ({ updateSubmissionGradesBatch: vi.fn() }));

import { generateObject } from 'ai';
import { getOrgIdByCourseId } from '@cio/db/queries/course';
import { isOrgOnPaidPlan } from '@cio/core/services/agent/usage';
import {
  getAnswerForAiReview,
  getAnswersWithAiReviewByExercise,
  getAnswersWithQuestionBySubmissionId,
  setAnswerAiReview,
  updateSubmissionGrades
} from '@cio/db/queries/submission';
import { enforceMathVisionAllowance, recordMathVisionUsage } from '@api/services/math/vision-usage';
import { updateSubmissionGradesBatch } from '@api/services/submission/submission';
import {
  bulkAcceptAiReviews,
  collectWorkingEvidence,
  recordAiReviewDecision,
  requestAiReview
} from '@api/services/submission/ai-review';

const COURSE_ID = 'course-1';
const rubricSettings = {
  acceptedAnswers: ['4'],
  answerPoints: 2,
  aiGrading: true,
  rubric: {
    steps: [
      { id: 's1', description: 'Subtracts 3 from both sides', points: 1 },
      { id: 's2', description: 'Divides by 2', points: 2 }
    ]
  }
};

const workedAnswer = (overrides: Record<string, unknown> = {}) => ({
  type: 'WORKED_SOLUTION',
  latex: 'x=4',
  working: { lines: ['2x+3=11', '2x=8', 'x=4'], files: [] },
  grading: { reason: 'equivalent' },
  ...overrides
});

const row = (overrides: Record<string, unknown> = {}) => ({
  answerId: 7,
  submissionId: 'sub-1',
  questionId: 5,
  answerData: workedAnswer(),
  point: 2,
  courseId: COURSE_ID,
  exerciseId: 'ex-1',
  gradingState: 'awaiting_manual',
  questionTypeId: 18,
  questionTitle: 'Solve $2x+3=11$',
  questionSettings: rubricSettings,
  questionPoints: 5,
  ...overrides
});

const modelOutput = {
  stepMarks: [
    { stepId: 's1', awarded: 1, comment: null },
    { stepId: 's2', awarded: 2, comment: 'Divided correctly' }
  ],
  firstWrongStep: null,
  comment: 'All steps shown.',
  confidence: 0.93
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getOrgIdByCourseId).mockResolvedValue('org-1' as never);
  vi.mocked(isOrgOnPaidPlan).mockResolvedValue(true);
  vi.mocked(generateObject).mockResolvedValue({
    object: modelOutput,
    usage: { inputTokens: 100, outputTokens: 40 }
  } as never);
});

describe('collectWorkingEvidence', () => {
  it('lets the engine judge typed lines', () => {
    const evidence = collectWorkingEvidence(
      workedAnswer({ working: { lines: ['2x+3=11', '2x=9'], files: [] } }) as never
    );

    expect(evidence.engineCheck?.firstIncorrectIndex).toBe(1);
  });

  it('turns paragraph HTML with math into text', () => {
    const evidence = collectWorkingEvidence({
      type: 'TEXTAREA',
      text: '<p>So <span data-type="inline-math" data-latex="x^2"></span> grows</p>'
    } as never);

    expect(evidence.text).toContain('$x^2$');
    expect(evidence.text).not.toContain('<');
  });
});

describe('requestAiReview', () => {
  it('refuses a free-plan organization before any model call', async () => {
    vi.mocked(isOrgOnPaidPlan).mockResolvedValue(false);
    vi.mocked(getAnswerForAiReview).mockResolvedValue(row() as never);

    await expect(
      requestAiReview({ courseId: COURSE_ID, submissionId: 'sub-1', questionId: 5, userId: 'u1' })
    ).rejects.toMatchObject({ code: 'UPGRADE_REQUIRED', statusCode: 403 });
    expect(generateObject).not.toHaveBeenCalled();
  });

  it('stores a normalised suggestion and counts the usage against the org pool', async () => {
    vi.mocked(getAnswerForAiReview).mockResolvedValue(row() as never);

    const review = await requestAiReview({ courseId: COURSE_ID, submissionId: 'sub-1', questionId: 5, userId: 'u1' });

    expect(enforceMathVisionAllowance).toHaveBeenCalledWith('org-1');
    expect(recordMathVisionUsage).toHaveBeenCalledWith(
      'org-1',
      'u1',
      COURSE_ID,
      { promptTokens: 100, completionTokens: 40 },
      'mock-vision'
    );
    expect(review).toMatchObject({ model: 'mock-vision', suggestedPoints: 3, maxPoints: 3, confidence: 0.93 });
    expect(setAnswerAiReview).toHaveBeenCalledWith(7, review);
  });

  it('lowers confidence when the engine finds a wrong typed line the model missed', async () => {
    vi.mocked(getAnswerForAiReview).mockResolvedValue(
      row({ answerData: workedAnswer({ working: { lines: ['2x+3=11', '2x=9', 'x=4'], files: [] } }) }) as never
    );

    const review = await requestAiReview({ courseId: COURSE_ID, submissionId: 'sub-1', questionId: 5, userId: 'u1' });

    expect(review.confidence).toBeLessThanOrEqual(0.4);
    expect(review.comment).toContain('line 2');
  });

  it('refuses a question that has not opted in', async () => {
    vi.mocked(getAnswerForAiReview).mockResolvedValue(
      row({ questionSettings: { ...rubricSettings, aiGrading: false } }) as never
    );

    await expect(
      requestAiReview({ courseId: COURSE_ID, submissionId: 'sub-1', questionId: 5, userId: 'u1' })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(generateObject).not.toHaveBeenCalled();
  });

  it('refuses an answer from another course', async () => {
    vi.mocked(getAnswerForAiReview).mockResolvedValue(row({ courseId: 'other' }) as never);

    await expect(
      requestAiReview({ courseId: COURSE_ID, submissionId: 'sub-1', questionId: 5, userId: 'u1' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('recordAiReviewDecision', () => {
  it('stores who decided what beside the suggestion', async () => {
    vi.mocked(getAnswerForAiReview).mockResolvedValue(
      row({ answerData: workedAnswer({ aiReview: { suggestedPoints: 3 } }) }) as never
    );

    const review = await recordAiReviewDecision({
      courseId: COURSE_ID,
      submissionId: 'sub-1',
      actorProfileId: 'teacher-1',
      decision: { questionId: 5, status: 'edited', awardedPoints: 2 }
    });

    expect(review.decision).toMatchObject({ status: 'edited', decidedBy: 'teacher-1', awardedPoints: 2 });
    expect(setAnswerAiReview).toHaveBeenCalledWith(7, review);
  });
});

describe('bulkAcceptAiReviews', () => {
  const suggestion = (confidence: number) => ({
    suggestedPoints: 3,
    confidence,
    stepMarks: [],
    model: 'm',
    reviewedAt: 'x',
    rubricVersion: 'v',
    maxPoints: 3,
    firstWrongStep: null,
    comment: ''
  });

  it('accepts confident suggestions, grades the submission and leaves unsure ones alone', async () => {
    vi.mocked(getAnswersWithAiReviewByExercise).mockResolvedValue([
      row({ answerData: workedAnswer({ aiReview: suggestion(0.95) }) }),
      row({ answerId: 8, submissionId: 'sub-2', answerData: workedAnswer({ aiReview: suggestion(0.5) }) })
    ] as never);
    vi.mocked(getAnswersWithQuestionBySubmissionId).mockResolvedValue([
      row({ answerData: workedAnswer({ aiReview: suggestion(0.95) }) })
    ] as never);

    const result = await bulkAcceptAiReviews({ courseId: COURSE_ID, exerciseId: 'ex-1', actorProfileId: 't1' });

    expect(result).toMatchObject({ acceptedCount: 1, completedSubmissionIds: ['sub-1'] });
    expect(result.accepted[0]).toMatchObject({
      submissionId: 'sub-1',
      questionId: 5,
      points: 5,
      decision: { decidedBy: 't1' }
    });
    expect(setAnswerAiReview).toHaveBeenCalledTimes(1);
    expect(updateSubmissionGradesBatch).toHaveBeenCalledWith(
      'sub-1',
      COURSE_ID,
      { answers: [{ questionId: 5, points: 5 }], total: 5 },
      { actorProfileId: 't1' }
    );
  });

  it('keeps the submission open while another manual answer still waits', async () => {
    vi.mocked(getAnswersWithAiReviewByExercise).mockResolvedValue([
      row({ answerData: workedAnswer({ aiReview: suggestion(0.95) }) })
    ] as never);
    vi.mocked(getAnswersWithQuestionBySubmissionId).mockResolvedValue([
      row({ answerData: workedAnswer({ aiReview: suggestion(0.95) }) }),
      row({ answerId: 9, questionId: 6, questionTypeId: 5, answerData: { type: 'SHORT_ANSWER', text: 'x' }, point: 0 })
    ] as never);

    const result = await bulkAcceptAiReviews({ courseId: COURSE_ID, exerciseId: 'ex-1', actorProfileId: 't1' });

    expect(result).toMatchObject({ acceptedCount: 1, completedSubmissionIds: [] });
    expect(updateSubmissionGradesBatch).not.toHaveBeenCalled();
    expect(updateSubmissionGrades).toHaveBeenCalledWith('sub-1', { answers: [{ questionId: 5, points: 5 }], total: 5 });
  });

  it('skips submissions a teacher already graded', async () => {
    vi.mocked(getAnswersWithAiReviewByExercise).mockResolvedValue([
      row({ gradingState: 'completed', answerData: workedAnswer({ aiReview: suggestion(0.99) }) })
    ] as never);

    const result = await bulkAcceptAiReviews({ courseId: COURSE_ID, exerciseId: 'ex-1', actorProfileId: 't1' });

    expect(result.acceptedCount).toBe(0);
  });
});
