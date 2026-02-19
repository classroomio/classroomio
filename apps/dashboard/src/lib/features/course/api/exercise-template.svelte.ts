import { BaseApi, classroomio } from '$lib/utils/services/api';
import type {
  GetTemplateByIdData,
  GetTemplateByIdRequest,
  GetTemplateByTagData,
  GetTemplateByTagRequest
} from '../utils/types';

/**
 * API class for exercise templates
 */
class ExerciseTemplateApi extends BaseApi {
  templates = $state<GetTemplateByTagData>([]);
  template = $state<GetTemplateByIdData>();
  templatesByTag = $state<Record<string, GetTemplateByTagData>>({});

  private getTagCacheKey(courseId: string, tag: string) {
    return `${courseId}:${tag}`;
  }

  /**
   * Fetches an exercise template metadata
   */
  async fetchTemplateById(courseId: string, id: string) {
    await this.execute<GetTemplateByIdRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].exercise.template[':id'].$get({
          param: { courseId, id }
        }),
      logContext: 'fetching exercise template by id',
      onSuccess: (response) => {
        this.template = response.data;
      }
    });
  }

  /**
   * Fetches an exercise template metadata
   */
  async fetchTemplatesByTag(courseId: string, tag: string) {
    const cacheKey = this.getTagCacheKey(courseId, tag);
    const cachedTemplates = this.templatesByTag[cacheKey];

    if (cachedTemplates) {
      this.templates = cachedTemplates;
      this.success = true;
      return;
    }

    await this.execute<GetTemplateByTagRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].exercise.template.tag[':tag'].$get({
          param: { courseId, tag }
        }),
      logContext: 'fetching exercise template by tag',
      onSuccess: (response) => {
        this.templates = response.data;
        this.templatesByTag = {
          ...this.templatesByTag,
          [cacheKey]: response.data
        };
      }
    });
  }

  reset() {
    this.templates = [];
    this.template = undefined;
    this.templatesByTag = {};
  }
}

export const exerciseTemplateApi = new ExerciseTemplateApi();
