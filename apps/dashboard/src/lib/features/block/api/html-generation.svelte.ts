import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { snackbar } from '$features/ui/snackbar/store';
import type { BlockEditHost, GenerateHtmlRequest } from '../utils/types';

export class HtmlGenerationApi extends BaseApiWithErrors {
  /**
   * Generates an HTML page from `prompt`, or rewrites `currentHtml` to apply it.
   * @returns the page, or null after showing an error.
   */
  async generate(host: BlockEditHost, prompt: string, currentHtml?: string): Promise<string | null> {
    let html: string | null = null;

    await this.execute<GenerateHtmlRequest>({
      requestFn: () =>
        classroomio.agent['generate-html'].$post({
          json: { courseId: host.courseId, lessonId: host.lessonId, prompt, html: currentHtml }
        }),
      logContext: 'generating html block',
      onSuccess: (response) => {
        html = response.data.html;
      },
      onError: () => {
        snackbar.error('course.navItem.lessons.materials.blocks.html.generate_error');
      }
    });

    return html;
  }
}
