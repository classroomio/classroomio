<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { mediaApi } from '$features/media/api';
  import { JobPoller, jobsApi, type MediaJobEnvelope } from '$features/jobs';
  import { sidePanel } from '$features/side-panel';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { onDestroy } from 'svelte';
  import type { LessonVideo } from './video-card-utils';
  import { lessonVideoBus } from './lesson-video-bus.svelte';
  import { TRANSCRIPT_PANEL_ID } from './transcript-panel-definition';

  interface Props {
    video: LessonVideo;
    onRemove: () => void;
    /** `inline` aligns with the title row (YouTube-style). `corner` is top-right overlay on the nearest `relative` ancestor. */
    menuPlacement?: 'inline' | 'corner';
  }

  let { video, onRemove, menuPlacement = 'inline' }: Props = $props();

  let isTranscribing = $state(false);
  let hasTranscript = $state(false);
  let hasCheckedTranscript = $state(false);
  let activePoller: JobPoller<MediaJobEnvelope> | null = null;

  const assetId = $derived((video as LessonVideo & { assetId?: string }).assetId ?? null);

  const canGenerateTranscript = $derived(video.type === 'upload' && !!assetId);

  onDestroy(() => {
    activePoller?.stop();
  });

  async function ensureTranscriptChecked() {
    if (hasCheckedTranscript || !assetId) return;

    hasCheckedTranscript = true;
    const data = await mediaApi.getAssetTranscript(assetId);
    hasTranscript = !!data?.segments?.length;
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

  const generateLabel = $derived(
    isTranscribing
      ? t.get('course.navItem.lessons.materials.tabs.video.generate_transcript_in_progress')
      : t.get('course.navItem.lessons.materials.tabs.video.generate_transcript')
  );
</script>

<DropdownMenu.Root
  onOpenChange={(open) => {
    if (open && canGenerateTranscript) {
      void ensureTranscriptChecked();
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
    {#if canGenerateTranscript}
      <DropdownMenu.Item
        disabled={isTranscribing}
        onclick={() => {
          void handleGenerateTranscript();
        }}
      >
        {generateLabel}
      </DropdownMenu.Item>
      {#if hasTranscript}
        <DropdownMenu.Item
          onclick={() => {
            void handleViewTranscript();
          }}
        >
          {$t('course.navItem.lessons.materials.tabs.video.view_transcript')}
        </DropdownMenu.Item>
      {/if}
    {/if}
    <DropdownMenu.Item class="ui:text-red-600" onclick={onRemove}>
      {$t('course.navItem.lessons.materials.tabs.video.remove_video')}
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
