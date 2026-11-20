import type { THtmlPage, THtmlPageCreate, THtmlPageGenerate } from '@cio/utils/validation/block';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { snackbar } from '$features/ui/snackbar/store';
import type { BlockEditHost, CreateHtmlPageRequest, GenerateHtmlPageRequest } from '../utils/types';

export class HtmlPageApi extends BaseApiWithErrors {
  /**
   * Stores an uploaded or pasted page.
   * @returns the stored page, or null after showing an error.
   */
  async create(host: BlockEditHost, input: THtmlPageCreate): Promise<THtmlPage | null> {
    let page: THtmlPage | null = null;

    await this.execute<CreateHtmlPageRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].blocks['html-pages'].$post({
          param: { courseId: host.courseId, lessonId: host.lessonId },
          json: input
        }),
      logContext: 'storing html page',
      onSuccess: (response) => {
        page = response.data;
      },
      onError: () => {
        snackbar.error('course.navItem.lessons.materials.blocks.html.save_error');
      }
    });

    return page;
  }

  /**
   * Generates a page with AI, or rewrites the page `input.assetId` points at.
   * @returns the new page, or null after showing an error.
   */
  async generate(host: BlockEditHost, input: THtmlPageGenerate): Promise<THtmlPage | null> {
    let page: THtmlPage | null = null;

    await this.execute<GenerateHtmlPageRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].blocks['html-pages'].generate.$post({
          param: { courseId: host.courseId, lessonId: host.lessonId },
          json: input
        }),
      logContext: 'generating html page',
      onSuccess: (response) => {
        page = response.data;
      },
      onError: () => {
        snackbar.error('course.navItem.lessons.materials.blocks.html.generate_error');
      }
    });

    return page;
  }
}
