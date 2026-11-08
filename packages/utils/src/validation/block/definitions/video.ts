import * as z from 'zod';

import { ZLessonVideoItem } from '../../lesson/lesson';
import { isAllowedHref } from '../../shared/safe-href';
import { defineBlock } from '../definition';

const HLS_PROXY_PATH = /^\/hls\/[\w./-]+$/;

export const ZVideoBlockData = ZLessonVideoItem.omit({ watchEnforced: true, link: true })
  .extend({ link: z.string() })
  .refine((video) => video.type === 'upload' || HLS_PROXY_PATH.test(video.link) || isAllowedHref(video.link), {
    message: 'Video link scheme is not allowed',
    path: ['link']
  });
export type TVideoBlockData = z.infer<typeof ZVideoBlockData>;

/**
 * The public shape of a stored video. Built field by field because `metadata` is a catchall:
 * only the poster leaves the server.
 */
export function toPublicVideoData(video: TVideoBlockData) {
  const thumbnailUrl = video.metadata?.thumbnailUrl;

  return {
    type: video.type,
    link: video.link,
    assetId: video.assetId,
    ...(video.key ? { key: video.key } : {}),
    ...(typeof thumbnailUrl === 'string' && thumbnailUrl ? { metadata: { thumbnailUrl } } : {})
  };
}

export const videoBlock = defineBlock({
  key: 'video',
  dataSchema: ZVideoBlockData,
  localizedContent: false,
  media: 'video',
  toPublicData: toPublicVideoData
});
