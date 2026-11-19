import * as z from 'zod';

import { defineBlock } from '../definition';
import { ZImageBlockData, type TImageBlockData } from './image';
import { toPublicVideoData, ZVideoBlockData, type TVideoBlockData } from './video';

export const TABS_ALIGNMENTS = ['left', 'center', 'right'] as const;
export const TABS_MIN_TABS = 1;
export const TABS_MAX_TABS = 10;
export const TAB_NAME_MAX_LENGTH = 60;
export const TAB_NOTE_MAX_LENGTH = 500;
export const TAB_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export const ZTabsAlignment = z.enum(TABS_ALIGNMENTS);
export type TTabsAlignment = z.infer<typeof ZTabsAlignment>;

/** The one image or video a tab shows under its note. */
export const ZTabMedia = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('image'), data: ZImageBlockData }),
  z.object({ kind: z.literal('video'), data: ZVideoBlockData })
]);
export type TTabMedia = z.infer<typeof ZTabMedia>;

export const ZTab = z.object({
  id: z.string().regex(TAB_ID_PATTERN),
  name: z.string().max(TAB_NAME_MAX_LENGTH),
  note: z.string().max(TAB_NOTE_MAX_LENGTH),
  media: ZTabMedia.optional()
});
export type TTab = z.infer<typeof ZTab>;

export const ZTabsBlockData = z
  .object({
    align: ZTabsAlignment,
    tabs: z.array(ZTab).min(TABS_MIN_TABS).max(TABS_MAX_TABS)
  })
  .refine((data) => new Set(data.tabs.map((tab) => tab.id)).size === data.tabs.length, {
    message: 'Tab ids must be unique',
    path: ['tabs']
  });
export type TTabsBlockData = z.infer<typeof ZTabsBlockData>;

export const ZTabsAgentInput = z
  .object({
    align: ZTabsAlignment,
    tabs: z
      .array(
        z.object({
          id: z
            .string()
            .regex(TAB_ID_PATTERN)
            .describe('Short id, unique within this block, such as "a". Keep the ids you read when editing.'),
          name: z.string().max(TAB_NAME_MAX_LENGTH),
          note: z.string().max(TAB_NOTE_MAX_LENGTH).describe('Plain text shown under the tab name.'),
          image: z
            .object({
              url: z
                .url({ protocol: /^https$/ })
                .describe('https URL of the image, exactly as the teacher or a tool gave it.'),
              alt: z.string().max(300).optional()
            })
            .optional()
            .describe('The image the tab shows. Leave it out for no image.')
        })
      )
      .min(TABS_MIN_TABS)
      .max(TABS_MAX_TABS)
  })
  .refine((data) => new Set(data.tabs.map((tab) => tab.id)).size === data.tabs.length, {
    message: 'Tab ids must be unique',
    path: ['tabs']
  });
export type TTabsAgentInput = z.infer<typeof ZTabsAgentInput>;

function toAgentTab(tab: TTab) {
  const media = tab.media;
  const image =
    media?.kind === 'image' ? { url: media.data.url, ...(media.data.alt ? { alt: media.data.alt } : {}) } : null;

  return {
    id: tab.id,
    name: tab.name,
    note: tab.note,
    ...(image ? { image } : {}),
    ...(media?.kind === 'video' ? { hasVideo: true } : {})
  };
}

/**
 * Builds a tab's media from the assistant's input. An image it sends replaces what the tab showed; a video
 * the tab already had stays, because the assistant cannot pick videos.
 */
function fromAgentTab(input: TTabsAgentInput['tabs'][number], previous: TTab | undefined): TTab {
  const previousMedia = previous?.media;
  const tab = { id: input.id, name: input.name, note: input.note };

  if (input.image) {
    const previousImage: Partial<TImageBlockData> = previousMedia?.kind === 'image' ? previousMedia.data : {};
    const data = {
      url: input.image.url,
      ...(input.image.alt ? { alt: input.image.alt } : {}),
      ...(previousImage.fit ? { fit: previousImage.fit } : {})
    };

    return { ...tab, media: { kind: 'image', data } };
  }

  return previousMedia?.kind === 'video' ? { ...tab, media: previousMedia } : tab;
}

function hasVideo(tab: TTab): tab is TTab & { media: { kind: 'video'; data: TVideoBlockData } } {
  return tab.media?.kind === 'video';
}

export const tabsBlock = defineBlock({
  key: 'tabs',
  dataSchema: ZTabsBlockData,
  localizedContent: false,
  media: null,
  embeddedMedia: {
    read: (data) => data.tabs.filter(hasVideo).map((tab) => ({ media: 'video' as const, data: tab.media.data })),
    write: (data, items) => {
      let next = 0;
      const tabs = data.tabs.map((tab) => {
        if (!hasVideo(tab)) return tab;

        const video = items[next] as TVideoBlockData | undefined;
        next += 1;

        return video ? { ...tab, media: { kind: 'video' as const, data: video } } : tab;
      });

      return { ...data, tabs };
    }
  },
  toPublicData: (data) => ({
    ...data,
    tabs: data.tabs.map((tab) =>
      hasVideo(tab) ? { ...tab, media: { kind: 'video' as const, data: toPublicVideoData(tab.media.data) } } : tab
    )
  }),
  agentEditableFields: [],
  agent: {
    purpose:
      'Tabs students switch between, each with a short note and optionally one image, for comparing options or splitting a topic into parts. A tab with hasVideo keeps its video; you cannot add or change videos.',
    inputSchema: ZTabsAgentInput,
    toInput: (data) => ({ align: data.align, tabs: data.tabs.map(toAgentTab) }),
    fromInput: (input, previous) => ({
      align: input.align,
      tabs: input.tabs.map((tab) =>
        fromAgentTab(
          tab,
          previous?.tabs.find((candidate) => candidate.id === tab.id)
        )
      )
    })
  }
});
