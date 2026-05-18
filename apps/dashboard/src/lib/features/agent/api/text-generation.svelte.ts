import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { snackbar } from '$features/ui/snackbar/store';
import type { GenerateTextRequest } from '../utils/types';

export class TextGenerationApi extends BaseApiWithErrors {
  async generate(
    prompt: string,
    tone: string,
    format: 'plain' | 'html' = 'plain',
    context?: string,
    courseId?: string
  ): Promise<string | null> {
    let generatedText: string | null = null;

    await this.execute<GenerateTextRequest>({
      requestFn: () =>
        classroomio.agent['generate-text'].$post({
          json: { prompt, tone: tone as 'professional' | 'casual' | 'expert' | 'friendly', format, context, courseId }
        }),
      logContext: 'generating text',
      onSuccess: (response) => {
        generatedText = response.data.text;
      },
      onError: () => {
        snackbar.error('Failed to generate text. Please try again.');
      }
    });

    return generatedText;
  }
}

export const textGenerationApi = new TextGenerationApi();
