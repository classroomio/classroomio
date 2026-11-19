<script lang="ts">
  import ImageIcon from '@lucide/svelte/icons/image';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import VideoIcon from '@lucide/svelte/icons/video';
  import { Button } from '@cio/ui/base/button';
  import * as Block from '@cio/ui/custom/block';
  import type { TTabMedia, TVideoBlockData } from '@cio/utils/validation/block';
  import LessonVideoSimpleCard from '$features/course/components/lesson/video/lesson-video-simple-card.svelte';
  import type { LessonVideo } from '$features/course/components/lesson/video/video-card-utils';
  import { t } from '$lib/utils/functions/translations';
  import { findBlockViewHost } from '../../utils/block-host';
  import { blockChangeLabel } from '../../utils/block-labels';
  import type { BlockViewModel } from '../../utils/types';
  import { getTabMediaLabels } from './tabs-labels';

  interface Props {
    media: TTabMedia | undefined;
    blockId: string;
    tabId: string;
    index: number;
    editable?: boolean;
    onAddImage?: () => void;
    onAddVideo?: () => void;
    onChange?: (media: TTabMedia | null) => void;
  }

  let { media, blockId, tabId, index, editable = false, onAddImage, onAddVideo, onChange }: Props = $props();

  const labels = getTabMediaLabels();
  const host = findBlockViewHost();

  function videoModel(data: TVideoBlockData): BlockViewModel<'video'> {
    return { id: `${blockId}-${tabId}`, type: 'video', data, content: '' };
  }

  function updateVideo(data: TVideoBlockData, patch: Record<string, unknown>) {
    onChange?.({ kind: 'video', data: { ...data, metadata: { ...data.metadata, ...patch } } });
  }
</script>

{#if media?.kind === 'image'}
  <div class="flex flex-col gap-2" data-testid="block-tabs-media-image">
    <Block.Image
      url={media.data.url}
      alt={media.data.alt ?? ''}
      fit={media.data.fit ?? 'cover'}
      {editable}
      uploadLabel={$t('course.navItem.lessons.materials.blocks.image.upload')}
      changeLabel={$t('course.navItem.lessons.materials.blocks.image.change')}
      settingsLabel={$t('course.navItem.lessons.materials.blocks.image.settings')}
      titleLabel={$t('course.navItem.lessons.materials.blocks.image.settings')}
      altLabel={$t('course.navItem.lessons.materials.blocks.image.alt')}
      altPlaceholder={$t('course.navItem.lessons.materials.blocks.image.alt_placeholder')}
      fitLabel={$t('course.navItem.lessons.materials.blocks.image.fit')}
      fitCoverLabel={$t('course.navItem.lessons.materials.blocks.image.fit_cover')}
      fitContainLabel={$t('course.navItem.lessons.materials.blocks.image.fit_contain')}
      cancelLabel={$t('common.cancel')}
      saveLabel={$t('common.save_changes')}
      onChange={onAddImage}
      onSaveSettings={(settings) =>
        onChange?.({ kind: 'image', data: { ...media.data, alt: settings.alt, fit: settings.fit } })}
    />
    {#if editable}
      <Button
        variant="ghost"
        size="sm"
        class="ui:text-muted-foreground ui:hover:text-destructive self-center"
        testId="block-tabs-media-remove"
        onclick={() => onChange?.(null)}
      >
        <Trash2Icon />
        {labels.removeImage}
      </Button>
    {/if}
  </div>
{:else if media?.kind === 'video'}
  <div class="flex flex-col gap-2" data-testid="block-tabs-media-video">
    {#if editable}
      <LessonVideoSimpleCard
        video={media.data as LessonVideo}
        {index}
        isEditMode
        changeLabel={blockChangeLabel('video')}
        onChange={onAddVideo}
        onThumbnailSaved={(thumbnailUrl) => updateVideo(media.data, { thumbnailUrl })}
        onMetadataUpdated={(patch) => updateVideo(media.data, patch)}
      />
      <Button
        variant="ghost"
        size="sm"
        class="ui:text-muted-foreground ui:hover:text-destructive self-center"
        testId="block-tabs-media-remove"
        onclick={() => onChange?.(null)}
      >
        <Trash2Icon />
        {labels.removeVideo}
      </Button>
    {:else if host}
      {@render host.videoPlayer({ block: videoModel(media.data), index })}
    {/if}
  </div>
{:else if editable}
  <div class="flex flex-wrap items-center justify-center gap-2" data-testid="block-tabs-media-empty">
    <Button variant="outline" size="sm" testId="block-tabs-add-image" onclick={onAddImage} class="shadow-none">
      <ImageIcon />
      {labels.addImage}
    </Button>
    <Button variant="outline" size="sm" testId="block-tabs-add-video" onclick={onAddVideo} class="shadow-none">
      <VideoIcon />
      {labels.addVideo}
    </Button>
  </div>
{/if}
