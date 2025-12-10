import { BaseApi, classroomio } from '$lib/utils/services/api';

import type { GetAllTemplatesMetadataSuccess, GetTemplateByIdSuccess } from '$lib/features/org/utils/types';

/**
 * API class for exercise templates
 */
class TemplateApi extends BaseApi {
  templates = $state<GetAllTemplatesMetadataSuccess['data']>({});
  template = $state<GetTemplateByIdSuccess['data']>([]);

  /**
   * Fetches an exercise template metadata
   */
  async fetchTemplateById(id: string) {
    await this.execute<(typeof classroomio.template)[':id']['$get']>({
      requestFn: () => classroomio.template[':id'].$get({ param: { id } }),
      logContext: 'fetching exercise template by id',
      onSuccess: (response) => {
        this.template = response.data;
      }
    });
  }

  /**
   * Fetches an exercise template metadata
   */
  async fetchTemplateByTag(tag: string) {
    await this.execute<(typeof classroomio.template)[':id']['$get']>({
      requestFn: () => classroomio.template.tag[':tag'].$get({ param: { tag } }),
      logContext: 'fetching exercise template by tag',
      onSuccess: (response) => {
        this.templates = response.data;
      }
    });
  }
}

export const templateApi = new TemplateApi();
