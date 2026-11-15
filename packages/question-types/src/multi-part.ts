export type MultiPartQuestion = {
  id: number;
  parentQuestionId?: number | null;
  points?: number | null;
};

export type MultiPartScore = {
  /** The stem question the parts belong to. */
  questionId: number;
  partIds: number[];
  points: number;
  maxPoints: number;
};

/** Ids of stem questions: the questions that at least one other question names as its parent. */
export function getMultiPartStemIds(
  questions: ReadonlyArray<Pick<MultiPartQuestion, 'id' | 'parentQuestionId'>>
): Set<number> {
  const stemIds = new Set<number>();
  for (const question of questions) {
    if (question.parentQuestionId != null) stemIds.add(Number(question.parentQuestionId));
  }

  return stemIds;
}

/**
 * Rolls part scores up to their stem question for display. Parts are scored as normal questions, so the rollup never
 * feeds back into the submission total.
 */
export function aggregateMultiPartScores(
  questions: ReadonlyArray<MultiPartQuestion>,
  scores: ReadonlyArray<{ questionId: number; points: number }>
): MultiPartScore[] {
  const pointsByQuestionId = new Map(scores.map((score) => [score.questionId, Number(score.points) || 0]));
  const rollups = new Map<number, MultiPartScore>();

  for (const question of questions) {
    if (question.parentQuestionId == null) continue;

    const stemId = Number(question.parentQuestionId);
    const rollup = rollups.get(stemId) ?? { questionId: stemId, partIds: [], points: 0, maxPoints: 0 };
    rollup.partIds.push(question.id);
    rollup.points = Math.round((rollup.points + (pointsByQuestionId.get(question.id) ?? 0)) * 100) / 100;
    rollup.maxPoints = Math.round((rollup.maxPoints + Number(question.points ?? 0)) * 100) / 100;
    rollups.set(stemId, rollup);
  }

  return [...rollups.values()];
}

/** Label of the part at `index` under its stem: (a), (b), … (z), then (aa). */
export function getPartLabel(index: number): string {
  let remaining = index;
  let letters = '';
  do {
    letters = String.fromCharCode(97 + (remaining % 26)) + letters;
    remaining = Math.floor(remaining / 26) - 1;
  } while (remaining >= 0);

  return `(${letters})`;
}
