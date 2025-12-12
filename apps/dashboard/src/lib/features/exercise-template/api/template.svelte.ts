import { BaseApi, classroomio } from '$lib/utils/services/api';
import type { TTemplate } from '@cio/db/types';

/**
 * API class for exercise templates
 */
class ExerciseTemplateApi extends BaseApi {
  templates = $state<Partial<TTemplate>[]>([]);
  template = $state<TTemplate>({} as TTemplate);

  /**
   * Fetches an exercise template metadata
   */
  async fetchTemplateById(id: string) {
    await this.execute<(typeof classroomio.exercise)['template'][':id']['$get']>({
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
    await this.execute<(typeof classroomio.exercise)['template']['tag'][':tag']['$get']>({
      requestFn: () => classroomio.exercise.template.tag[':tag'].$get({ param: { tag } }),
      logContext: 'fetching exercise template by tag',
      onSuccess: (response) => {
        this.templates = response.data;
      }
    });
  }
}

export const exerciseTemplateApi = new ExerciseTemplateApi();
