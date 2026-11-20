import { BaseApi, classroomio } from '$lib/utils/services/api';

import type { QuestionAnalysisRequest, QuestionAnalysisRow } from '../utils/types';
import { QUESTION_ANALYSIS_MEASURES, toQuestionAnalysisRows } from '../utils/question-analysis-utils';

class QuestionAnalysisApi extends BaseApi {
  rows = $state<QuestionAnalysisRow[] | null>(null);

  async load(courseId: string, exerciseId: string) {
    this.rows = null;

    await this.execute<QuestionAnalysisRequest>({
      requestFn: () =>
        classroomio.analytics.query.$post({
          json: {
            scope: { type: 'course', id: courseId },
            spec: {
              source: 'question_result',
              dimensions: ['question'],
              measures: [...QUESTION_ANALYSIS_MEASURES],
              filters: [{ field: 'exercise', op: 'eq', value: exerciseId }],
              sort: [],
              limit: 100,
              page: 1,
              range: 'all'
            }
          }
        }),
      logContext: 'loading question analysis',
      onSuccess: (response) => {
        this.rows = toQuestionAnalysisRows(response.data.rows);
      }
    });
  }
}

export const questionAnalysisApi = /* @__PURE__ */ new QuestionAnalysisApi();
