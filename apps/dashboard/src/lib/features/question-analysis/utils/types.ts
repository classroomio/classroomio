import type { ItemFlag } from '@cio/question-types/item-analysis';

import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type QuestionAnalysisRequest = typeof classroomio.analytics.query.$post;
export type QuestionAnalysisSuccess = Extract<InferResponseType<QuestionAnalysisRequest>, { success: true }>;
export type QuestionAnalysisResult = QuestionAnalysisSuccess['data'];
export type QuestionAnalysisCell = QuestionAnalysisResult['rows'][number][string];

export type CommonWrongAnswer = { label: string; count: number; grade: string };

export type QuestionAnalysisRow = {
  questionId: string;
  title: string;
  facility: number | null;
  discrimination: number | null;
  medianSeconds: number | null;
  wrongAnswers: CommonWrongAnswer[];
  flags: ItemFlag[];
};
