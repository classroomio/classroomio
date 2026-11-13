import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { t } from '$lib/utils/functions/translations';
import { snackbar } from '$features/ui/snackbar/store';
import type { TBlockLocaleCode } from '@cio/utils/validation/block';
import type {
  AttachLessonBlockRequest,
  CreateLessonBlockRequest,
  DuplicateLessonBlockRequest,
  ListLessonBlocksRequest,
  MoveLessonPlacementRequest,
  RemoveLessonPlacementRequest,
  UpdateLessonBlockLocaleRequest,
  UpdateLessonBlockRequest,
  UpdateLessonPlacementRequest
} from '../utils/types';

type LessonParams = { courseId: string; lessonId: string };

class LessonBlockApi extends BaseApiWithErrors {
  async list(params: LessonParams) {
    return this.execute<ListLessonBlocksRequest>({
      requestFn: () => classroomio.course[':courseId'].lesson[':lessonId'].blocks.$get({ param: params }),
      logContext: 'loading lesson blocks'
    });
  }

  async create(params: LessonParams, json: Parameters<CreateLessonBlockRequest>[0]['json']) {
    return this.execute<CreateLessonBlockRequest>({
      requestFn: () => classroomio.course[':courseId'].lesson[':lessonId'].blocks.$post({ param: params, json }),
      logContext: 'creating lesson block'
    });
  }

  async attach(params: LessonParams, json: Parameters<AttachLessonBlockRequest>[0]['json']) {
    return this.execute<AttachLessonBlockRequest>({
      requestFn: () => classroomio.course[':courseId'].lesson[':lessonId'].blocks.attach.$post({ param: params, json }),
      logContext: 'attaching lesson block'
    });
  }

  async updatePlacement(
    params: LessonParams & { placementId: string },
    json: Parameters<UpdateLessonPlacementRequest>[0]['json']
  ) {
    return this.execute<UpdateLessonPlacementRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].blocks.placements[':placementId'].$patch({
          param: params,
          json
        }),
      logContext: 'updating lesson block placement'
    });
  }

  async movePlacement(
    params: LessonParams & { placementId: string },
    json: Parameters<MoveLessonPlacementRequest>[0]['json']
  ) {
    return this.execute<MoveLessonPlacementRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].blocks.placements[':placementId'].move.$put({
          param: params,
          json
        }),
      logContext: 'moving lesson block'
    });
  }

  async removePlacement(params: LessonParams & { placementId: string }) {
    return this.execute<RemoveLessonPlacementRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].blocks.placements[':placementId'].$delete({
          param: params
        }),
      logContext: 'removing lesson block'
    });
  }

  async updateData(params: LessonParams & { blockId: string }, json: Parameters<UpdateLessonBlockRequest>[0]['json']) {
    return this.execute<UpdateLessonBlockRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].blocks[':blockId'].$patch({ param: params, json }),
      logContext: 'updating lesson block',
      onError: (error) => {
        const reason = error.message;
        snackbar.error(t.get('course.navItem.lessons.materials.blocks.save_failed', { reason }));
      }
    });
  }

  async updateLocale(
    params: LessonParams & { blockId: string; locale: TBlockLocaleCode },
    json: Parameters<UpdateLessonBlockLocaleRequest>[0]['json']
  ) {
    return this.execute<UpdateLessonBlockLocaleRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].blocks[':blockId'].locale[':locale'].$put({
          param: params,
          json
        }),
      logContext: 'saving lesson block text'
    });
  }

  async duplicate(
    params: LessonParams & { blockId: string },
    json: Parameters<DuplicateLessonBlockRequest>[0]['json']
  ) {
    return this.execute<DuplicateLessonBlockRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].blocks[':blockId'].duplicate.$post({ param: params, json }),
      logContext: 'duplicating lesson block'
    });
  }
}

export const lessonBlockApi = /* @__PURE__ */ new LessonBlockApi();
