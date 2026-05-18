<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import CaptionsIcon from '@lucide/svelte/icons/captions';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { t } from '$lib/utils/functions/translations';
  import { sidePanel } from '$features/side-panel';
  import { lessonVideoBus } from './lesson-video-bus.svelte';
  import type { AssetTranscriptPayload } from '$features/media/utils/types';

  type Segment = AssetTranscriptPayload['segments'][number];

  const transcript = $derived(lessonVideoBus.transcript);
  const transcriptLoading = $derived(lessonVideoBus.transcriptLoading);
  const segments = $derived<Segment[]>(transcript?.segments ?? []);
  const language = $derived(transcript?.language ?? '');
  const currentTimeSeconds = $derived(lessonVideoBus.currentTimeSeconds);

  function isActiveSegment(segment: Segment, index: number): boolean {
    const isLast = index === segments.length - 1;

    if (isLast) {
      return currentTimeSeconds >= segment.start && currentTimeSeconds <= segment.end;
    }

    return currentTimeSeconds >= segment.start && currentTimeSeconds < segment.end;
  }

  function handleKeydown(event: KeyboardEvent, start: number) {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    lessonVideoBus.seek(start);
  }

  function formatTimestamp(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');

    return `${m}:${s}`;
  }
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <header class="border-border flex items-center justify-between gap-2 border-b px-4 py-3">
    <div class="flex min-w-0 items-center gap-2">
      <CaptionsIcon size={18} class="ui:text-primary shrink-0" />
      <div class="min-w-0">
        <h2 class="text-sm font-semibold">
          {$t('course.navItem.lessons.materials.tabs.video.transcript.title')}
        </h2>
        {#if language}
          <p class="ui:text-muted-foreground truncate text-xs">
            {$t('course.navItem.lessons.materials.tabs.video.transcript.language', { language })}
          </p>
        {/if}
      </div>
    </div>
    <IconButton
      onclick={() => sidePanel.close()}
      variant="outline"
      size="icon-xs"
      tooltip={$t('side_panel.close_aria')}
    >
      <XIcon size={16} />
    </IconButton>
  </header>

  <div class="min-h-0 flex-1 overflow-y-auto p-3">
    {#if segments.length}
      {#each segments as segment, index (segment.start + segment.end + index)}
        {@const active = isActiveSegment(segment, index)}
        <button
          type="button"
          class="ui:text-foreground hover:ui:bg-muted/80 focus-visible:ui:ring-ring mb-1 w-full rounded-md px-2 py-1.5 text-left text-sm leading-snug transition-colors last:mb-0 focus:outline-none focus-visible:ring-2 {active
            ? 'ui:bg-primary/10 ui:font-medium'
            : ''}"
          data-active={active ? 'true' : undefined}
          onclick={() => lessonVideoBus.seek(segment.start)}
          onkeydown={(e) => handleKeydown(e, segment.start)}
        >
          <span class="ui:text-muted-foreground mr-1.5 text-xs tabular-nums">
            {formatTimestamp(segment.start)}
          </span>
          {segment.text}
        </button>
      {/each}
    {:else if transcriptLoading}
      <p class="ui:text-muted-foreground py-8 text-center text-sm">
        {$t('course.navItem.lessons.materials.tabs.video.transcript.loading')}
      </p>
    {:else}
      <p class="ui:text-muted-foreground py-8 text-center text-sm">
        {$t('course.navItem.lessons.materials.tabs.video.transcript.empty')}
      </p>
    {/if}
  </div>
</div>
