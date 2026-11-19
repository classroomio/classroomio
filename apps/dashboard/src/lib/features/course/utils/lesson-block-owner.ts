import type { TLocale } from '@cio/db/types';
import type { BlockOwner, BlockRecord } from '$features/block/utils/types';
import { lessonBlockApi } from '../api/lesson-block.svelte';

/**
 * Points a block list at one lesson's block endpoints.
 */
export function createLessonBlockOwner(courseId: string, lessonId: string): BlockOwner {
  const params = { courseId, lessonId };
  const recordOf = (result: { data: BlockRecord } | null | undefined) => result?.data ?? null;

  return {
    list: async () => (await lessonBlockApi.list(params))?.data ?? null,
    create: async (input) => recordOf(await lessonBlockApi.create(params, input)),
    updateData: async (blockId, data, expectedVersion) =>
      recordOf(await lessonBlockApi.updateData({ ...params, blockId }, { data, expectedVersion })),
    updateContent: async (blockId, locale: TLocale, content, expectedVersion) =>
      recordOf(await lessonBlockApi.updateLocale({ ...params, blockId, locale }, { content, expectedVersion })),
    updatePlacement: async (placementId, settings) =>
      recordOf(await lessonBlockApi.updatePlacement({ ...params, placementId }, settings)),
    move: async (placementId, anchor) =>
      recordOf(await lessonBlockApi.movePlacement({ ...params, placementId }, anchor)),
    remove: async (placementId) => Boolean(await lessonBlockApi.removePlacement({ ...params, placementId }))
  };
}
