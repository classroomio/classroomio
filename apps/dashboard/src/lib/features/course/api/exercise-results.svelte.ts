import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  AnswerClustersData,
  AnswerClustersRequest,
  ExerciseResultsData,
  ExerciseResultsRequest,
  ResetClusterOverrideRequest,
  SetClusterOverrideRequest
} from '../utils/types';
import type { TClusterOverrideBody, TExerciseResultsQuery } from '@cio/utils/validation/math';
import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';

/**
 * API class for the exercise results grid and the answer clusters behind it
 */
export class ExerciseResultsApi extends BaseApiWithErrors {
  results = $state<ExerciseResultsData | null>(null);
  clusters = $state<AnswerClustersData | null>(null);
  isLoadingClusters = $state(false);

  async load(courseId: string, exerciseId: string, query: Partial<TExerciseResultsQuery>) {
    await this.execute<ExerciseResultsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].submission.results[':exerciseId'].$get({
          param: { courseId, exerciseId },
          query: {
            page: String(query.page ?? 1),
            limit: String(query.limit ?? 25),
            filter: query.filter ?? 'all',
            ...(query.cohortId ? { cohortId: query.cohortId } : {})
          }
        }),
      logContext: 'loading exercise results',
      onSuccess: (response) => {
        this.results = response.data;
        this.success = true;
      },
      onError: (result) => {
        snackbar.error(result.message);
      }
    });
  }

  async loadClusters(courseId: string, exerciseId: string, questionId: number) {
    this.isLoadingClusters = true;

    await this.execute<AnswerClustersRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].submission.clusters[':exerciseId'][':questionId'].$get({
          param: { courseId, exerciseId, questionId: String(questionId) }
        }),
      logContext: 'grouping answers',
      onSuccess: (response) => {
        this.clusters = response.data;
      },
      onError: (result) => {
        snackbar.error(result.message);
      }
    });

    this.isLoadingClusters = false;
  }

  async setOverride(courseId: string, exerciseId: string, questionId: number, body: TClusterOverrideBody) {
    let changedAnswers: number | null = null;

    await this.execute<SetClusterOverrideRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].submission.clusters[':exerciseId'][':questionId'].$put({
          param: { courseId, exerciseId, questionId: String(questionId) },
          json: body
        }),
      logContext: 'applying a decision to an answer group',
      onSuccess: (response) => {
        this.clusters = response.data.clusters;
        changedAnswers = response.data.regrade.answersChanged;
        snackbar.success(t.get('exercise_results.snackbar.applied', { count: changedAnswers }));
      },
      onError: (result) => {
        snackbar.error(result.message);
      }
    });

    return changedAnswers;
  }

  async resetOverride(courseId: string, exerciseId: string, questionId: number, key: string) {
    let changedAnswers: number | null = null;

    await this.execute<ResetClusterOverrideRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].submission.clusters[':exerciseId'][':questionId'].reset.$post({
          param: { courseId, exerciseId, questionId: String(questionId) },
          json: { key }
        }),
      logContext: 'undoing a decision on an answer group',
      onSuccess: (response) => {
        this.clusters = response.data.clusters;
        changedAnswers = response.data.regrade.answersChanged;
        snackbar.success(t.get('exercise_results.snackbar.undone', { count: changedAnswers }));
      },
      onError: (result) => {
        snackbar.error(result.message);
      }
    });

    return changedAnswers;
  }
}

export const exerciseResultsApi = /* @__PURE__ */ new ExerciseResultsApi();
