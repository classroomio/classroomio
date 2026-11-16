import type { AiReview, AiReviewStepMark } from './answer-data';
import { roundPoints } from './points';

export type RubricStep = { id: string; description: string; points: number };
export type MarkingRubric = { steps: RubricStep[] };

/** What the model returns before it is checked against the rubric. */
export type RawAiReview = {
  stepMarks: Array<{ stepId: string; awarded: number; comment?: string }>;
  firstWrongStep: string | null;
  comment: string;
  confidence: number;
};

export const AI_REVIEW_CONFIDENT_THRESHOLD = 0.85;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Reads `settings.rubric`; steps without text or with negative points are dropped. */
export function readMarkingRubric(settings: Record<string, unknown> | null | undefined): MarkingRubric {
  const raw = settings?.rubric;
  const rawSteps = isRecord(raw) && Array.isArray(raw.steps) ? raw.steps : [];
  const steps = rawSteps.flatMap((entry, index): RubricStep[] => {
    if (!isRecord(entry)) return [];

    const description = String(entry.description ?? '').trim();
    const points = Number(entry.points);
    if (!description || !Number.isFinite(points) || points < 0) return [];

    return [{ id: String(entry.id ?? 'step-' + (index + 1)), description, points: roundPoints(points) }];
  });

  return { steps };
}

/** AI suggestions are opt-in per question and need at least one rubric step to mark against. */
export function isAiGradingEnabled(settings: Record<string, unknown> | null | undefined): boolean {
  return settings?.aiGrading === true && readMarkingRubric(settings).steps.length > 0;
}

export function getRubricMaxPoints(rubric: MarkingRubric): number {
  return roundPoints(rubric.steps.reduce((sum, step) => sum + step.points, 0));
}

/** A short stable fingerprint of the rubric text and points, stored with each suggestion so edits to the rubric are visible. */
export function getRubricVersion(rubric: MarkingRubric): string {
  const text = JSON.stringify(rubric.steps.map((step) => [step.id, step.description, step.points]));
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Turns the model's output into a stored suggestion: every rubric step gets a mark between 0 and its points, the
 * total is recomputed from those marks and capped at `maxPoints`, and an unknown first-wrong-step is dropped.
 */
export function normaliseAiReview(
  raw: RawAiReview,
  rubric: MarkingRubric,
  context: { model: string; reviewedAt: string; maxPoints: number }
): AiReview {
  const rawMarkByStep = new Map(raw.stepMarks.map((mark) => [mark.stepId, mark]));
  const stepMarks: AiReviewStepMark[] = rubric.steps.map((step) => {
    const rawMark = rawMarkByStep.get(step.id);
    const requested = Number(rawMark?.awarded);
    const awarded = Number.isFinite(requested) ? roundPoints(Math.min(Math.max(requested, 0), step.points)) : 0;
    const comment = rawMark?.comment?.trim();

    return { stepId: step.id, awarded, max: step.points, ...(comment ? { comment } : {}) };
  });
  const total = roundPoints(stepMarks.reduce((sum, mark) => sum + mark.awarded, 0));
  const confidence = Number.isFinite(raw.confidence) ? Math.min(Math.max(raw.confidence, 0), 1) : 0;
  const knownStep = rubric.steps.some((step) => step.id === raw.firstWrongStep);

  return {
    model: context.model,
    reviewedAt: context.reviewedAt,
    rubricVersion: getRubricVersion(rubric),
    stepMarks,
    suggestedPoints: Math.min(total, context.maxPoints),
    maxPoints: context.maxPoints,
    firstWrongStep: knownStep ? raw.firstWrongStep : null,
    comment: raw.comment.trim(),
    confidence: Math.round(confidence * 100) / 100
  };
}

/** True when a suggestion is undecided and the reviewer was confident enough to accept it in bulk. */
export function isBulkAcceptable(review: AiReview | undefined, threshold = AI_REVIEW_CONFIDENT_THRESHOLD): boolean {
  return Boolean(review && !review.decision && review.confidence >= threshold);
}
