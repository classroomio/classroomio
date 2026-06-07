<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import CaptionsIcon from '@lucide/svelte/icons/captions';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import ImageIcon from '@lucide/svelte/icons/image';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { mediaApi } from '$features/media/api';
  import { ManageThumbnailsDialog } from '$features/media/components';
  import type { OrganizationAsset } from '$features/media/utils';
  import { JobPoller, jobsApi, type MediaJobEnvelope } from '$features/jobs';
  import { sidePanel } from '$features/side-panel';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { onDestroy } from 'svelte';
  import {
    canGenerateHls1080,
    getHls1080Status,
    getVideoMetadata,
    isHlsUploadVideo,
    hasHls1080Rendition,
    type LessonVideo
  } from './video-card-utils';
  import { encodeAndUploadHls1080 } from './hls-encoder';
  import { lessonVideoBus } from './lesson-video-bus.svelte';
  import { TRANSCRIPT_PANEL_ID } from './transcript-panel-definition';

  interface Props {
    video: LessonVideo;
    onRemove: () => void;
    onThumbnailSaved?: (thumbnailUrl: string) => void;
    onHlsMetadataUpdated?: (metadata: Record<string, unknown>) => void;
    /** `inline` aligns with the title row (YouTube-style). `corner` is top-right overlay on the nearest `relative` ancestor. */
    menuPlacement?: 'inline' | 'corner';
  }

  let { video, onRemove, onThumbnailSaved, onHlsMetadataUpdated, menuPlacement = 'inline' }: Props = $props();

  let manageThumbsOpen = $state(false);
  let manageThumbsAsset = $state<OrganizationAsset | null>(null);
  let isLoadingAsset = $state(false);
  let dropdownOpen = $state(false);

  let isTranscribing = $state(false);
  let hasTranscript = $state(false);
  let hasCheckedTranscript = $state(false);
  let activePoller: JobPoller<MediaJobEnvelope> | null = null;
  let isGenerating1080 = $state(false);
  let sourceFileInput: HTMLInputElement | undefined = $state();

  const assetId = $derived((video as LessonVideo & { assetId?: string }).assetId ?? null);

  const canGenerateTranscript = $derived(video.type === 'upload' && !!assetId);
  const canManageThumbnails = $derived(video.type === 'upload' && !!assetId);
  const hls1080Status = $derived(getHls1080Status(video));
  const showGenerate1080 = $derived(canGenerateHls1080(video) && !isGenerating1080);
  const show1080Ready = $derived(hls1080Status === 'ready');
  const show1080Unavailable = $derived(
    isHlsUploadVideo(video) && !hasHls1080Rendition(video) && !isGenerating1080 && hls1080Status === 'unavailable'
  );

  onDestroy(() => {
    activePoller?.stop();
  });

  async function ensureTranscriptChecked() {
    if (hasCheckedTranscript || !assetId) return;

    hasCheckedTranscript = true;
    const data = await mediaApi.getAssetTranscript(assetId);
    hasTranscript = !!data?.segments?.length;
  }

  async function ensureHlsMetadataChecked() {
    if (!assetId || !isHlsUploadVideo(video)) return;

    const metadata = getVideoMetadata(video);
    if (metadata.sourceHeight != null) return;

    const asset = await mediaApi.refreshAsset(assetId);
    if (!asset?.metadata || typeof asset.metadata !== 'object' || Array.isArray(asset.metadata)) return;

    const assetMetadata = asset.metadata as Record<string, unknown>;
    onHlsMetadataUpdated?.({
      ...(typeof assetMetadata.sourceWidth === 'number' ? { sourceWidth: assetMetadata.sourceWidth } : {}),
      ...(typeof assetMetadata.sourceHeight === 'number' ? { sourceHeight: assetMetadata.sourceHeight } : {}),
      ...(Array.isArray(assetMetadata.hlsRenditions) ? { hlsRenditions: assetMetadata.hlsRenditions } : {}),
      ...(typeof assetMetadata.hls1080Status === 'string' ? { hls1080Status: assetMetadata.hls1080Status } : {})
    });
  }

  async function startTranscriptionPoll(afterAssetId: string) {
    activePoller?.stop();
    activePoller = null;

    const runs = await jobsApi.getMediaJobsForAsset(afterAssetId);
    const latest = runs?.[0];

    if (!latest) {
      isTranscribing = false;

      return;
    }

    if (latest.job.status === 'completed') {
      isTranscribing = false;
      hasTranscript = true;
      snackbar.success('snackbar.media_manager.transcription_completed');

      return;
    }

    if (latest.job.status === 'failed' || latest.job.status === 'canceled') {
      isTranscribing = false;

      return;
    }

    activePoller = new JobPoller<MediaJobEnvelope>({
      fetch: () => jobsApi.getMediaJob(latest.job.id),
      onUpdate: (envelope) => {
        if (envelope.job.status === 'completed') {
          activePoller?.stop();
          activePoller = null;
          isTranscribing = false;
          hasTranscript = true;
          snackbar.success('snackbar.media_manager.transcription_completed');
        }

        if (envelope.job.status === 'failed' || envelope.job.status === 'canceled') {
          activePoller?.stop();
          activePoller = null;
          isTranscribing = false;
        }
      }
    });
    activePoller.start();
  }

  async function handleGenerateTranscript() {
    if (!assetId) return;

    const ok = await mediaApi.generateTranscript(assetId);
    if (!ok) return;

    isTranscribing = true;
    await startTranscriptionPoll(assetId);
  }

  async function handleViewTranscript() {
    if (!assetId) return;

    lessonVideoBus.assetId = assetId;
    lessonVideoBus.transcriptLoading = true;
    sidePanel.open(TRANSCRIPT_PANEL_ID);

    try {
      const data = await mediaApi.getAssetTranscript(assetId);
      lessonVideoBus.transcript = data;
      hasTranscript = !!data?.segments?.length;
    } finally {
      lessonVideoBus.transcriptLoading = false;
    }
  }

  async function handleManageThumbnails() {
    if (!assetId || isLoadingAsset) return;

    // Close the dropdown immediately so the user doesn't see it floating
    // behind the dialog during the asset refresh round-trip.
    dropdownOpen = false;

    isLoadingAsset = true;
    try {
      const asset = await mediaApi.refreshAsset(assetId);
      if (!asset) {
        snackbar.error('snackbar.media_manager.list_failed');
        return;
      }

      manageThumbsAsset = asset;
      manageThumbsOpen = true;
    } finally {
      isLoadingAsset = false;
    }
  }

  function handleThumbnailSaved(asset: OrganizationAsset) {
    manageThumbsAsset = asset;
    if (asset.thumbnailUrl) {
      onThumbnailSaved?.(asset.thumbnailUrl);
    }
  }

  function handleGenerate1080Click() {
    if (!assetId || isGenerating1080) return;

    dropdownOpen = false;
    sourceFileInput?.click();
  }

  async function handleSourceFileSelected(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const selectedFile = input.files?.[0];
    input.value = '';

    if (!selectedFile || !assetId) return;

    isGenerating1080 = true;
    onHlsMetadataUpdated?.({ hls1080Status: 'generating' });

    try {
      const result = await encodeAndUploadHls1080({
        file: selectedFile,
        assetId
      });

      onHlsMetadataUpdated?.({
        hlsRenditions: result.hlsRenditions,
        hls1080Status: result.hls1080Status
      });
      snackbar.success('snackbar.lesson_video.generate_1080_completed');
    } catch (error) {
      console.error('Failed to generate 1080p rendition', error);
      onHlsMetadataUpdated?.({ hls1080Status: 'failed' });
      snackbar.error('snackbar.lesson_video.generate_1080_failed');
    } finally {
      isGenerating1080 = false;
    }
  }

  const generateLabel = $derived(
    isTranscribing
      ? t.get('course.navItem.lessons.materials.tabs.video.generate_transcript_in_progress')
      : t.get('course.navItem.lessons.materials.tabs.video.generate_transcript')
  );

  const generate1080Label = $derived(
    isGenerating1080
      ? t.get('course.navItem.lessons.materials.tabs.video.generate_1080_in_progress')
      : t.get('course.navItem.lessons.materials.tabs.video.generate_1080')
  );
</script>

<input
  bind:this={sourceFileInput}
  type="file"
  accept="video/*"
  class="hidden"
  onchange={(event) => {
    void handleSourceFileSelected(event);
  }}
/>

<DropdownMenu.Root
  bind:open={dropdownOpen}
  onOpenChange={(open) => {
    if (!open) return;

    if (canGenerateTranscript) {
      void ensureTranscriptChecked();
    }

    if (isHlsUploadVideo(video)) {
      void ensureHlsMetadataChecked();
    }
  }}
>
  <DropdownMenu.Trigger
    class={menuPlacement === 'corner'
      ? 'ui:data-[state=open]:opacity-100 absolute top-2 right-2 z-40 flex items-center justify-center opacity-0 transition-all delay-150 duration-200 ease-in-out group-hover:opacity-100'
      : 'ui:data-[state=open]:opacity-100 -mt-0.5 -mr-1 flex shrink-0 items-center justify-center opacity-100'}
    aria-label={$t('course.navItem.lessons.materials.tabs.video.simple_card.menu_aria')}
    onclick={(e) => e.stopPropagation()}
  >
    <IconButton variant="ghost">
      <EllipsisVerticalIcon size={16} />
    </IconButton>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    {#if canManageThumbnails}
      <DropdownMenu.Item
        disabled={isLoadingAsset}
        onclick={() => {
          void handleManageThumbnails();
        }}
      >
        <span class="flex items-center gap-2">
          <ImageIcon size={14} />
          {$t('media_manager.actions.manage_thumbnails')}
        </span>
      </DropdownMenu.Item>
    {/if}
    {#if showGenerate1080}
      <DropdownMenu.Item disabled={isGenerating1080} onclick={handleGenerate1080Click}>
        <span class="flex items-center gap-2">
          <SparklesIcon size={14} />
          {generate1080Label}
        </span>
      </DropdownMenu.Item>
    {/if}
    {#if isGenerating1080}
      <DropdownMenu.Item disabled>
        <span class="flex items-center gap-2">
          <SparklesIcon size={14} />
          {$t('course.navItem.lessons.materials.tabs.video.generate_1080_in_progress')}
        </span>
      </DropdownMenu.Item>
    {/if}
    {#if show1080Ready}
      <DropdownMenu.Item disabled>
        <span class="flex items-center gap-2">
          <SparklesIcon size={14} />
          {$t('course.navItem.lessons.materials.tabs.video.generate_1080_ready')}
        </span>
      </DropdownMenu.Item>
    {/if}
    {#if show1080Unavailable}
      <DropdownMenu.Item disabled>
        <span class="flex items-center gap-2">
          <SparklesIcon size={14} />
          {$t('course.navItem.lessons.materials.tabs.video.generate_1080_unavailable')}
        </span>
      </DropdownMenu.Item>
    {/if}
    {#if canGenerateTranscript && !hasTranscript}
      <DropdownMenu.Item
        disabled={isTranscribing}
        onclick={() => {
          void handleGenerateTranscript();
        }}
      >
        <span class="flex items-center gap-2">
          <CaptionsIcon size={14} />
          {generateLabel}
        </span>
      </DropdownMenu.Item>
    {/if}
    {#if canGenerateTranscript && hasTranscript}
      <DropdownMenu.Item
        onclick={() => {
          void handleViewTranscript();
        }}
      >
        <span class="flex items-center gap-2">
          <EyeIcon size={14} />
          {$t('course.navItem.lessons.materials.tabs.video.view_transcript')}
        </span>
      </DropdownMenu.Item>
    {/if}
    <DropdownMenu.Item class="ui:text-red-600" onclick={onRemove}>
      <span class="flex items-center gap-2">
        <Trash2Icon size={14} />
        {$t('course.navItem.lessons.materials.tabs.video.remove_video')}
      </span>
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<ManageThumbnailsDialog
  bind:open={manageThumbsOpen}
  asset={manageThumbsAsset}
  onThumbnailSaved={handleThumbnailSaved}
/>
