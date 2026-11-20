import type { TPracticeCreate } from '@cio/utils/validation/practice';

import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { snackbar } from '$features/ui/snackbar/store';

import type { CreatePracticeRequest, CreatedPractice } from '../utils/types';

class PracticeApi extends BaseApiWithErrors {
  async create(courseId: string, body: TPracticeCreate): Promise<CreatedPractice | null> {
    let created: CreatedPractice | null = null;

    await this.execute<CreatePracticeRequest>({
      requestFn: () => classroomio.course[':courseId'].practice.$post({ param: { courseId }, json: body }),
      logContext: 'creating practice',
      onSuccess: (response) => {
        created = response.data;
      },
      onError: (error) => {
        snackbar.error(error.message);
      }
    });

    return created;
  }
}

export const practiceApi = /* @__PURE__ */ new PracticeApi();
