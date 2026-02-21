import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { snackbar } from '$features/ui/snackbar/store';
import type { DeleteCourseContentRequest, UpdateCourseContentRequest } from '../utils/types';
import { ContentType } from '@cio/utils/constants/content';

export class ContentApi extends BaseApiWithErrors {
  async updateContent(
    courseId: string,
    items: Array<{
      id: string;
      type: ContentType.Lesson | ContentType.Exercise;
      isUnlocked?: boolean;
      order?: number;
      sectionId?: string | null;
    }>
  ) {
    const result = await this.execute<UpdateCourseContentRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].content.$put({
          param: { courseId },
          json: { items }
        }),
      logContext: 'updating course content',
      onSuccess: () => {
        this.success = true;
        this.errors = {};
      },
      onError: (error) => {
        if (typeof error === 'string') {
          snackbar.error('Failed to update content');
        }
      }
    });

    return Boolean(result?.success);
  }

  async deleteContent(
    courseId: string,
    payload: { sectionId?: string; items?: Array<{ id: string; type: ContentType.Lesson | ContentType.Exercise }> }
  ) {
    const result = await this.execute<DeleteCourseContentRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].content.$delete({
          param: { courseId },
          json: payload
        }),
      logContext: 'deleting course content',
      onSuccess: () => {
        this.success = true;
        this.errors = {};
      },
      onError: (error) => {
        if (typeof error === 'string') {
          snackbar.error('Failed to delete content');
        }
      }
    });

    return Boolean(result?.success);
  }
}

export const contentApi = new ContentApi();
