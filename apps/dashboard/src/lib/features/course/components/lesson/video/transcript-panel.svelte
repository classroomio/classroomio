<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import type { AssetTranscriptPayload } from '$features/media/utils/types';

  type Segment = AssetTranscriptPayload['segments'][number];

  interface Props {
    segments: Segment[];
    currentTimeSeconds: number;
    language: string;
    onSeek: (seconds: number) => void;
    class?: string;
  }

  let { segments, currentTimeSeconds, language, onSeek, class: className = '' }: Props = $props();

  const transcriptTitleKey = 'course.navItem.lessons.materials.tabs.video.transcript.title';
  const transcriptLanguageKey = 'course.navItem.lessons.materials.tabs.video.transcript.language';

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
    onSeek(start);
  }
</script>

<aside
  class="ui:border-border flex min-h-[200px] flex-col rounded-md border p-3 {className}"
  aria-label={t.get(transcriptTitleKey)}
>
  <div class="ui:text-muted-foreground mb-2 shrink-0 text-xs font-medium">
    {t.get(transcriptLanguageKey, { language })}
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto pr-1">
    {#each segments as segment, index (segment.start + segment.end + index)}
      <button
        type="button"
        class="ui:text-foreground hover:ui:bg-muted/80 focus:ui:outline-none focus-visible:ui:ring-2 focus-visible:ui:ring-ring mb-1 w-full rounded-md px-2 py-1.5 text-left text-sm leading-snug transition-colors last:mb-0 {isActiveSegment(
          segment,
          index
        )
          ? 'ui:bg-primary/10 ui:font-medium'
          : ''}"
        data-active={isActiveSegment(segment, index) ? 'true' : undefined}
        onclick={() => onSeek(segment.start)}
        onkeydown={(e) => handleKeydown(e, segment.start)}
      >
        <span class="ui:text-muted-foreground mr-1.5 text-xs tabular-nums">
          {Math.floor(segment.start / 60)}:{Math.floor(segment.start % 60)
            .toString()
            .padStart(2, '0')}
        </span>
        {segment.text}
      </button>
    {/each}
  </div>
</aside>
