<script lang="ts">
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import XIcon from '@lucide/svelte/icons/x';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import CaptionsIcon from '@lucide/svelte/icons/captions';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Button } from '@cio/ui/base/button';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Separator } from '@cio/ui/base/separator';
  import { t } from '$lib/utils/functions/translations';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { sidePanel } from '$features/side-panel';
  import { mediaApi } from '$features/media/api';
  import { lessonVideoBus } from './lesson-video-bus.svelte';
  import type { TranscriptSegment } from '$features/media/utils/types';

  const activeSource = $derived.by(() => lessonVideoBus.getActiveTranscriptSource());
  const transcript = $derived(activeSource?.transcript ?? null);
  const transcriptLoading = $derived(activeSource?.transcriptLoading ?? false);
  const segments = $derived<TranscriptSegment[]>(transcript?.segments ?? []);
  const language = $derived(transcript?.language ?? '');
  const assetId = $derived(activeSource?.assetId ?? null);
  const currentTimeSeconds = $derived(activeSource?.currentTimeSeconds ?? 0);

  const navigableSources = $derived.by(() => lessonVideoBus.getNavigableTranscriptSources());
  const activeNavIndex = $derived(navigableSources.findIndex((source) => source.assetId === assetId));
  const activeVideoNumber = $derived(activeNavIndex >= 0 ? activeNavIndex + 1 : 1);
  const canGoToPreviousVideo = $derived(activeNavIndex > 0);
  const canGoToNextVideo = $derived(activeNavIndex >= 0 && activeNavIndex < navigableSources.length - 1);
  const showVideoNavigation = $derived(navigableSources.length > 1);

  let editing = $state(false);
  let saving = $state(false);
  let draft = $state<TranscriptSegment[]>([]);

  const canEdit = $derived(Boolean($isOrgAdmin) && Boolean(assetId) && segments.length > 0);

  function isActiveSegment(segment: TranscriptSegment, index: number): boolean {
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
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');

    return `${minutes}:${remainingSeconds}`;
  }

  function goToPreviousVideo() {
    if (!canGoToPreviousVideo) return;

    if (editing) {
      cancelEditing();
    }

    const previousSource = navigableSources[activeNavIndex - 1];
    lessonVideoBus.selectTranscriptSource(previousSource.assetId);
  }

  function goToNextVideo() {
    if (!canGoToNextVideo) return;

    if (editing) {
      cancelEditing();
    }

    const nextSource = navigableSources[activeNavIndex + 1];
    lessonVideoBus.selectTranscriptSource(nextSource.assetId);
  }

  function startEditing() {
    draft = segments.map((segment) => ({ ...segment }));
    editing = true;
  }

  function cancelEditing() {
    editing = false;
    draft = [];
  }

  async function save() {
    if (!assetId) return;

    saving = true;
    const updated = await mediaApi.updateAssetTranscript(assetId, draft);
    saving = false;

    if (!updated) return;

    lessonVideoBus.setTranscript(updated);
    editing = false;
    draft = [];
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
    <div class="flex shrink-0 items-center gap-1">
      {#if editing}
        <Button variant="ghost" size="sm" onclick={cancelEditing} disabled={saving}>
          {$t('course.navItem.lessons.materials.tabs.video.transcript.cancel')}
        </Button>
        <Button size="sm" onclick={save} disabled={saving}>
          {$t('course.navItem.lessons.materials.tabs.video.transcript.save')}
        </Button>
      {:else}
        {#if canEdit}
          <IconButton
            onclick={startEditing}
            variant="outline"
            size="icon-xs"
            tooltip={$t('course.navItem.lessons.materials.tabs.video.transcript.edit')}
          >
            <PencilIcon size={16} />
          </IconButton>
        {/if}
        <IconButton
          onclick={() => sidePanel.close()}
          variant="outline"
          size="icon-xs"
          tooltip={$t('side_panel.close_aria')}
        >
          <XIcon size={16} />
        </IconButton>
      {/if}
    </div>
  </header>

  {#if showVideoNavigation && !editing}
    <div class="border-border flex items-center justify-between gap-2 border-b px-4 py-2">
      <IconButton
        onclick={goToPreviousVideo}
        variant="outline"
        size="icon-xs"
        disabled={!canGoToPreviousVideo}
        tooltip={$t('course.navItem.lessons.materials.tabs.video.transcript.previous_video')}
      >
        <ChevronLeftIcon size={16} />
      </IconButton>

      <p class="min-w-0 truncate text-center text-sm font-medium">
        {$t('course.navItem.lessons.materials.tabs.video.transcript.video_nav_label', {
          number: activeVideoNumber
        })}
      </p>

      <IconButton
        onclick={goToNextVideo}
        variant="outline"
        size="icon-xs"
        disabled={!canGoToNextVideo}
        tooltip={$t('course.navItem.lessons.materials.tabs.video.transcript.next_video')}
      >
        <ChevronRightIcon size={16} />
      </IconButton>
    </div>
  {:else if showVideoNavigation && editing}
    <Separator />
  {/if}

  <div class="min-h-0 flex-1 overflow-y-auto p-3">
    {#if editing}
      {#each draft as segment, index (index)}
        <div class="mb-3 last:mb-0">
          <span class="ui:text-muted-foreground mb-1 block text-xs tabular-nums">
            {formatTimestamp(segment.start)}
          </span>
          <Textarea
            bind:value={draft[index].text}
            rows={2}
            disabled={saving}
            aria-label={$t('course.navItem.lessons.materials.tabs.video.transcript.segment_label', {
              timestamp: formatTimestamp(segment.start)
            })}
          />
        </div>
      {/each}
    {:else if segments.length}
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
