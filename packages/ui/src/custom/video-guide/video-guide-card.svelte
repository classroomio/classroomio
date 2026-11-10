<script lang="ts">
  import PlayIcon from '@lucide/svelte/icons/play';
  import { Badge } from '../../base/badge';
  import { cn } from '../../tools';
  import { getVideoGuideThumbnailUrl } from './utils';
  import VideoGuideDialog from './video-guide-dialog.svelte';

  interface Props {
    videoId: string;
    title: string;
    description: string;
    badgeLabel?: string;
    actionLabel?: string;
    closeLabel?: string;
    align?: 'center' | 'start';
    open?: boolean;
    class?: string;
    testId?: string;
  }

  let {
    videoId,
    title,
    description,
    badgeLabel,
    actionLabel,
    closeLabel,
    align = 'center',
    open = $bindable(false),
    class: className,
    testId
  }: Props = $props();
</script>

<button
  type="button"
  class={cn(
    'ui:bg-background ui:hover:bg-muted/60 ui:focus-visible:ring-ring ui:group ui:flex ui:w-full ui:max-w-md ui:items-center ui:gap-4 ui:rounded-lg ui:border ui:p-2 ui:pr-4 ui:text-left ui:transition ui:focus-visible:ring-2 ui:focus-visible:outline-none',
    align === 'center' && 'ui:mx-auto',
    className
  )}
  data-testid={testId}
  onclick={() => (open = true)}
>
  <span class="ui:bg-muted ui:relative ui:aspect-video ui:w-36 ui:shrink-0 ui:overflow-hidden ui:rounded-md">
    <img src={getVideoGuideThumbnailUrl(videoId)} alt="" class="ui:size-full ui:object-cover" loading="lazy" />
    <span
      class="ui:absolute ui:inset-0 ui:flex ui:items-center ui:justify-center ui:bg-black/20 ui:transition ui:group-hover:bg-black/35"
    >
      <span
        class="ui:flex ui:size-9 ui:items-center ui:justify-center ui:rounded-full ui:bg-white ui:text-black ui:shadow"
      >
        <PlayIcon class="ui:size-4 ui:translate-x-px ui:fill-current" />
      </span>
    </span>
  </span>

  <span class="ui:flex ui:min-w-0 ui:flex-col ui:gap-1">
    {#if badgeLabel || actionLabel}
      <span class="ui:flex ui:items-center ui:gap-2">
        {#if badgeLabel}
          <Badge class="ui:text-primary ui:bg-primary/10 ui:border-transparent">{badgeLabel}</Badge>
        {/if}
        {#if actionLabel}
          <span class="ui:text-muted-foreground ui:text-xs">{actionLabel}</span>
        {/if}
      </span>
    {/if}
    <span class="ui:text-sm ui:font-medium ui:text-pretty">{description}</span>
  </span>
</button>

<VideoGuideDialog bind:open {videoId} {title} {closeLabel} testId={testId ? `${testId}-dialog` : undefined} />
