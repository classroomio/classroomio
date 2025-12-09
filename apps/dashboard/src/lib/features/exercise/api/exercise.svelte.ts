import { BaseApi, classroomio } from '$lib/utils/services/api';

import type { GetAllTemplatesMetadataSuccess, GetTemplateByIdSuccess } from '$lib/features/org/utils/types';

/**
 * API class for exercise modal templates
 */
class ExerciseApi extends BaseApi {
  templates = $state<GetAllTemplatesMetadataSuccess['data']>({});
  template = $state<GetTemplateByIdSuccess['data']>([]);

  /**
   * Fetches all exercise templates metadata
   */
  async fetchTemplates() {
    await this.execute<typeof classroomio.mocks.$get>({
      requestFn: () => classroomio.mocks.$get(),
      logContext: 'fetching exercise templates',
      onSuccess: (response) => {
        this.templates = response.data;
      }
    });
  }

  async fetchTemplateById(id: string) {
    await this.execute<(typeof classroomio.mocks)[':id']['$get']>({
      requestFn: () => classroomio.mocks[':id'].$get({ param: { id } }),
      logContext: 'fetching exercise template by id',
      onSuccess: (response) => {
        this.template = response.data;
      }
    });
  }
}

export const exerciseApi = new ExerciseApi();
