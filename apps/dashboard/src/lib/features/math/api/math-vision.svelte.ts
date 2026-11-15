import { BaseApi, classroomio } from '$lib/utils/services/api';
import { ErrorCodes } from '@cio/utils/constants';
import { hasErrorCode } from '$lib/utils/services/api/errors';
import { t } from '$lib/utils/functions/translations';
import type { MathImageConversion, MathImagePayload, MathImageSource } from '@cio/ui/custom/math-text';
import type {
  ConvertImageRequest,
  ImportWorksheetRequest,
  WorksheetFileMediaType,
  WorksheetQuestion
} from '../utils/types';

class MathVisionApi extends BaseApi {
  /**
   * Converts one image to LaTeX. Rejects with an Error whose message is ready to show the user.
   */
  async convertImage(courseId: string, image: MathImagePayload, source: MathImageSource): Promise<MathImageConversion> {
    let conversion: MathImageConversion | undefined;

    await this.execute<ConvertImageRequest>({
      requestFn: () => classroomio.math['convert-image'].$post({ json: { courseId, source, image } }),
      logContext: 'converting image to math',
      onSuccess: (result) => {
        conversion = result.data;
      }
    });

    if (!conversion) throw new Error(this.getFailureMessage());

    return conversion;
  }

  async importWorksheet(
    courseId: string,
    document: { mediaType: WorksheetFileMediaType; data: string }
  ): Promise<WorksheetQuestion[] | undefined> {
    let questions: WorksheetQuestion[] | undefined;

    await this.execute<ImportWorksheetRequest>({
      requestFn: () => classroomio.math['import-worksheet'].$post({ json: { courseId, document } }),
      logContext: 'importing worksheet',
      onSuccess: (result) => {
        questions = result.data.questions;
      }
    });

    return questions;
  }

  getFailureMessage(): string {
    const error = this.lastError;
    if (!error) return t.get('math_vision.image.conversion_failed');
    if (hasErrorCode(error, ErrorCodes.MATH_VISION_LIMIT_REACHED)) return t.get('math_vision.errors.limit_reached');
    if (hasErrorCode(error, 'TOKEN_LIMIT_REACHED')) return t.get('math_vision.errors.token_limit');
    if (hasErrorCode(error, 'AI_NOT_CONFIGURED')) return t.get('math_vision.errors.not_configured');

    return t.get('math_vision.image.conversion_failed');
  }
}

export const mathVisionApi = new MathVisionApi();
