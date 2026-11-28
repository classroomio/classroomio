<script lang="ts">
  import ImageIcon from '@lucide/svelte/icons/image';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import VideoIcon from '@lucide/svelte/icons/video';
  import { Button } from '@cio/ui/base/button';
  import * as Block from '@cio/ui/custom/block';
  import type { TTabMedia } from '@cio/utils/validation/block';
  import LessonVideoSimpleCard from '$features/course/components/lesson/video/lesson-video-simple-card.svelte';
  import type { LessonVideo } from '$features/course/components/lesson/video/video-card-utils';
  import { t } from '$lib/utils/functions/translations';
  import { blockChangeLabel } from '../../utils/block-labels';
  import { getTabMediaLabels } from './tabs-labels';

  interface Props {
    media: TTabMedia | undefined;
    index: number;
    onAddImage: () => void;
    onAddVideo: () => void;
    onChange: (media: TTabMedia | null) => void;
  }

  let { media, index, onAddImage, onAddVideo, onChange }: Props = $props();

  const labels = getTabMediaLabels();

  /** Merges a metadata patch into the tab's video, unless it belongs to a video the tab no longer holds. */
  function updateVideo(patch: Record<string, unknown>, sourceAssetId?: string) {
    if (media?.kind !== 'video') return;
    if (sourceAssetId && sourceAssetId !== media.data.assetId) return;

    const metadata = { ...media.data.metadata, ...patch };
    onChange({ kind: 'video', data: { ...media.data, metadata } });
  }
</script>

{#if media?.kind === 'image'}
  <div class="flex flex-col gap-2" data-testid="block-tabs-media-image">
    <Block.Image
      url={media.data.url}
      alt={media.data.alt ?? ''}
      fit={media.data.fit ?? 'cover'}
      editable
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
        onChange({ kind: 'image', data: { ...media.data, alt: settings.alt, fit: settings.fit } })}
    />
    <Button
      variant="ghost"
      size="sm"
      class="ui:text-muted-foreground ui:hover:text-destructive self-center"
      testId="block-tabs-media-remove"
      onclick={() => onChange(null)}
    >
      <Trash2Icon />
      {labels.removeImage}
    </Button>
  </div>
{:else if media?.kind === 'video'}
  <div class="flex flex-col gap-2" data-testid="block-tabs-media-video">
    <LessonVideoSimpleCard
      video={media.data as LessonVideo}
      {index}
      isEditMode
      changeLabel={blockChangeLabel('video')}
      onChange={onAddVideo}
      onThumbnailSaved={(thumbnailUrl, sourceAssetId) => updateVideo({ thumbnailUrl }, sourceAssetId)}
      onMetadataUpdated={updateVideo}
    />
    <Button
      variant="ghost"
      size="sm"
      class="ui:text-muted-foreground ui:hover:text-destructive self-center"
      testId="block-tabs-media-remove"
      onclick={() => onChange(null)}
    >
      <Trash2Icon />
      {labels.removeVideo}
    </Button>
  </div>
{:else}
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
