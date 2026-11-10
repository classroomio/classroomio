<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import CirclePlayIcon from '@lucide/svelte/icons/circle-play';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import type { VideoGuide } from '../utils/types';
  import VideoGuideDialog from './video-guide-dialog.svelte';

  interface Props {
    guide: VideoGuide;
    title: string;
    description: string;
    storageKey: string;
    testId?: string;
  }

  let { guide, title, description, storageKey, testId }: Props = $props();

  let visible = $state(false);
  let videoOpen = $state(false);

  function markSeen() {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      return;
    }
  }

  function dismiss() {
    visible = false;
    markSeen();
  }

  function watchVideo() {
    dismiss();
    videoOpen = true;
  }

  onMount(() => {
    try {
      visible = localStorage.getItem(storageKey) !== '1';
    } catch {
      visible = false;
    }
  });

  onDestroy(() => {
    if (visible) markSeen();
  });
</script>

{#if visible}
  <div
    role="note"
    class="ui:bg-primary ui:text-primary-foreground absolute top-full z-30 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-lg p-4 text-left shadow-lg max-md:left-0 md:right-0"
    data-testid={testId}
  >
    <span class="ui:bg-primary absolute -top-1.5 size-3 rotate-45 max-md:left-28 md:right-8" aria-hidden="true"></span>

    <p class="text-sm font-semibold text-pretty">{title}</p>
    <p class="mt-1 text-sm text-pretty opacity-90">{description}</p>

    <div class="mt-3 flex items-center justify-end gap-2">
      <Button
        size="sm"
        variant="ghost"
        class="bg-white/15! text-white! hover:bg-white/25!"
        testId={testId ? `${testId}-dismiss` : undefined}
        onclick={dismiss}
      >
        {$t('video_guide.dismiss')}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        class="ui:text-primary! bg-white! hover:bg-white/90!"
        testId={testId ? `${testId}-watch` : undefined}
        onclick={watchVideo}
      >
        <CirclePlayIcon class="size-4" />
        {$t('video_guide.watch_video')}
      </Button>
    </div>
  </div>
{/if}

<VideoGuideDialog bind:open={videoOpen} {guide} />
