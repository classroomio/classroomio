import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';

import { snackbar } from '$features/ui/snackbar/store';

export interface Quiz {
  id: string;
  title: string;
  questions?: any[];
  timelimit?: string;
  theme?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export type QuizListRequest = (typeof classroomio.organization)[':orgId']['quiz']['$get'];
export type QuizGetRequest = (typeof classroomio.organization)[':orgId']['quiz'][':quizId']['$get'];
export type QuizCreateRequest = (typeof classroomio.organization)[':orgId']['quiz']['$post'];
export type QuizUpdateRequest = (typeof classroomio.organization)[':orgId']['quiz'][':quizId']['$put'];
export type QuizDeleteRequest = (typeof classroomio.organization)[':orgId']['quiz'][':quizId']['$delete'];

/**
 * API class for quiz operations
 */
export class QuizApi extends BaseApiWithErrors {
  quizzes = $state<Quiz[]>([]);
  quiz = $state<Quiz | null>(null);

  /**
   * Lists quizzes for an organization
   */
  async list(orgId: string) {
    await this.execute<QuizListRequest>({
      requestFn: () =>
        classroomio.organization[':orgId'].quiz.$get({
          param: { orgId }
        }),
      logContext: 'listing quizzes',
      onSuccess: (response) => {
        if (response.data) {
          this.quizzes = response.data;
          this.success = true;
          this.errors = {};
        }
      },
      onError: () => {
        snackbar.error('Failed to list quizzes');
      }
    });
  }

  /**
   * Gets a quiz by ID
   */
  async get(orgId: string, quizId: string) {
    await this.execute<QuizGetRequest>({
      requestFn: () =>
        classroomio.organization[':orgId'].quiz[':quizId'].$get({
          param: { orgId, quizId }
        }),
      logContext: 'fetching quiz',
      onSuccess: (response) => {
        if (response.data) {
          this.quiz = response.data;
          this.success = true;
          this.errors = {};
        }
      },
      onError: () => {
        snackbar.error('Failed to fetch quiz');
      }
    });
  }

  /**
   * Creates a new quiz
   */
  async create(orgId: string, data: { title: string; questions?: any[]; timelimit?: string; theme?: string }) {
    await this.execute<QuizCreateRequest>({
      requestFn: () =>
        classroomio.organization[':orgId'].quiz.$post({
          param: { orgId },
          json: data
        }),
      logContext: 'creating quiz',
      onSuccess: (response) => {
        if (response.data) {
          this.quizzes = [...this.quizzes, response.data];
          this.success = true;
          this.errors = {};
        }
      },
      onError: () => {
        snackbar.error('Failed to create quiz');
      }
    });

    return this.success ? this.quizzes[this.quizzes.length - 1] : null;
  }

  /**
   * Updates a quiz
   */
  async update(
    orgId: string,
    quizId: string,
    data: { title?: string; questions?: any[]; timelimit?: string; theme?: string }
  ) {
    await this.execute<QuizUpdateRequest>({
      requestFn: () =>
        classroomio.organization[':orgId'].quiz[':quizId'].$put({
          param: { orgId, quizId },
          json: data
        }),
      logContext: 'updating quiz',
      onSuccess: (response) => {
        if (response.data) {
          this.quizzes = this.quizzes.map((q) => (q.id === quizId ? response.data : q));
          if (this.quiz?.id === quizId) {
            this.quiz = response.data;
          }
          this.success = true;
          this.errors = {};
        }
      },
      onError: () => {
        snackbar.error('Failed to update quiz');
      }
    });
  }

  /**
   * Deletes a quiz
   */
  async delete(orgId: string, quizId: string) {
    await this.execute<QuizDeleteRequest>({
      requestFn: () =>
        classroomio.organization[':orgId'].quiz[':quizId'].$delete({
          param: { orgId, quizId }
        }),
      logContext: 'deleting quiz',
      onSuccess: () => {
        this.quizzes = this.quizzes.filter((q) => q.id !== quizId);
        if (this.quiz?.id === quizId) {
          this.quiz = null;
        }
        this.success = true;
        this.errors = {};
      },
      onError: () => {
        snackbar.error('Failed to delete quiz');
      }
    });
  }
}

export const quizApi = new QuizApi();
