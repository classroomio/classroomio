import { BaseApi, classroomio } from '$lib/utils/services/api';
import type { TExerciseTemplate } from '@cio/db/types';
import type { GetTemplateByIdRequest, GetTemplateByTagData, GetTemplateByTagRequest } from '../utils/types';

/**
 * API class for exercise templates
 */
class ExerciseTemplateApi extends BaseApi {
  templates = $state<GetTemplateByTagData>([]);
  template = $state<TExerciseTemplate>({} as TExerciseTemplate);

  /**
   * Fetches an exercise template metadata
   */
  async fetchTemplateById(id: string) {
    await this.execute<GetTemplateByIdRequest>({
      requestFn: () => classroomio.exercise.template[':id'].$get({ param: { id } }),
      logContext: 'fetching exercise template by id',
      onSuccess: (response) => {
        this.template = response.data;
      }
    });
  }

  /**
   * Fetches an exercise template metadata
   */
  async fetchTemplatesByTag(tag: string) {
    await this.execute<GetTemplateByTagRequest>({
      requestFn: () => classroomio.exercise.template.tag[':tag'].$get({ param: { tag } }),
      logContext: 'fetching exercise template by tag',
      onSuccess: (response) => {
        this.templates = response.data;
      }
    });
  }
}

export const exerciseTemplateApi = new ExerciseTemplateApi();
