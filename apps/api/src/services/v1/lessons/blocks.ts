import type {
  TPublicApiAttachLessonBlock,
  TPublicApiCreateLessonBlock,
  TPublicApiDuplicateLessonBlock,
  TPublicApiLessonBlockLocaleParam,
  TPublicApiLessonBlockParam,
  TPublicApiLessonPlacementParam,
  TPublicApiMoveLessonPlacement,
  TPublicApiSetLessonBlockLocale,
  TPublicApiUpdateLessonBlock,
  TPublicApiUpdateLessonPlacement,
  TPublicApiCourseLessonParam
} from '@cio/utils/validation/public-api';
import {
  attachLessonBlock,
  createLessonBlock,
  duplicateLessonBlock,
  getLessonBlocks,
  moveLessonPlacement,
  removeLessonPlacement,
  updateLessonBlock,
  updateLessonBlockLocale,
  updateLessonPlacement
} from '@cio/core/services/block/block';
import type { LessonBlock } from '@cio/core/services/block/block-view';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertAutomationActor, assertCourseTeamAccess, assertLessonInCourse } from '../shared';
import { resolveLessonVideos } from './videos';

export function toPublicLessonBlock(block: LessonBlock) {
  const { key: _storageKey, ...data } = block.data as Record<string, unknown> & { key?: string };

  return { ...block, data };
}

function assertSingleAnchor(anchor: { beforePlacementId?: string; afterPlacementId?: string }) {
  if (anchor.beforePlacementId && anchor.afterPlacementId) {
    throw new AppError(
      'Provide either beforePlacementId or afterPlacementId, not both',
      ErrorCodes.VALIDATION_ERROR,
      400
    );
  }
}

async function authorize(orgId: string, actorId: string | null, params: TPublicApiCourseLessonParam) {
  assertAutomationActor(actorId);
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertLessonInCourse(params.courseId, params.lessonId);

  return actorId;
}

export async function listPublicApiLessonBlocksService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonParam
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertLessonInCourse(params.courseId, params.lessonId);

  return (await getLessonBlocks(params.lessonId)).map(toPublicLessonBlock);
}

export async function createPublicApiLessonBlockService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonParam,
  payload: TPublicApiCreateLessonBlock
) {
  const actor = await authorize(orgId, actorId, params);
  assertSingleAnchor(payload);

  const anchor = { beforePlacementId: payload.beforePlacementId, afterPlacementId: payload.afterPlacementId };
  const options = { actorProfileId: actor };

  if (payload.type === 'note') {
    const block = await createLessonBlock(
      params.lessonId,
      { type: 'note', data: {}, content: payload.content, locale: payload.locale, ...anchor },
      options
    );

    return toPublicLessonBlock(block);
  }

  if (payload.type === 'slides') {
    const block = await createLessonBlock(
      params.lessonId,
      { type: 'slides', data: payload.slides, ...anchor },
      options
    );

    return toPublicLessonBlock(block);
  }

  const [video] = await resolveLessonVideos(orgId, actor, [payload.video]);
  const block = await createLessonBlock(
    params.lessonId,
    {
      type: 'video',
      data: video,
      required: payload.required,
      watchThreshold: payload.watchThreshold,
      ...anchor
    },
    options
  );

  return toPublicLessonBlock(block);
}

export async function attachPublicApiLessonBlockService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonParam,
  payload: TPublicApiAttachLessonBlock
) {
  const actor = await authorize(orgId, actorId, params);
  assertSingleAnchor(payload);

  return toPublicLessonBlock(await attachLessonBlock(params.lessonId, payload, { actorProfileId: actor }));
}

export async function updatePublicApiLessonBlockService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLessonBlockParam,
  payload: TPublicApiUpdateLessonBlock
) {
  const actor = await authorize(orgId, actorId, params);
  if (Boolean(payload.video) === Boolean(payload.slides)) {
    throw new AppError('Provide exactly one of video or slides', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const data = payload.slides ?? (await resolveLessonVideos(orgId, actor, [payload.video!]))[0];
  const block = await updateLessonBlock(
    params.lessonId,
    params.blockId,
    { data: data as Record<string, unknown>, expectedVersion: payload.expectedVersion },
    { actorProfileId: actor }
  );

  return toPublicLessonBlock(block);
}

export async function setPublicApiLessonBlockLocaleService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLessonBlockLocaleParam,
  payload: TPublicApiSetLessonBlockLocale
) {
  const actor = await authorize(orgId, actorId, params);
  const block = await updateLessonBlockLocale(params.lessonId, params.blockId, params.locale, payload, {
    actorProfileId: actor
  });

  return toPublicLessonBlock(block);
}

export async function updatePublicApiLessonPlacementService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLessonPlacementParam,
  payload: TPublicApiUpdateLessonPlacement
) {
  await authorize(orgId, actorId, params);

  return toPublicLessonBlock(await updateLessonPlacement(params.lessonId, params.placementId, payload));
}

export async function movePublicApiLessonPlacementService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLessonPlacementParam,
  payload: TPublicApiMoveLessonPlacement
) {
  await authorize(orgId, actorId, params);
  assertSingleAnchor(payload);
  if (!payload.beforePlacementId && !payload.afterPlacementId) {
    throw new AppError('Provide beforePlacementId or afterPlacementId', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return toPublicLessonBlock(await moveLessonPlacement(params.lessonId, params.placementId, payload));
}

export async function removePublicApiLessonPlacementService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLessonPlacementParam
) {
  const actor = await authorize(orgId, actorId, params);

  return removeLessonPlacement(params.lessonId, params.placementId, { actorProfileId: actor });
}

export async function duplicatePublicApiLessonBlockService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLessonBlockParam,
  payload: TPublicApiDuplicateLessonBlock
) {
  const actor = await authorize(orgId, actorId, params);

  return toPublicLessonBlock(
    await duplicateLessonBlock(params.lessonId, params.blockId, payload, { actorProfileId: actor })
  );
}
