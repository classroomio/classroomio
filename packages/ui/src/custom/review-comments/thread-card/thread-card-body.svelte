<script lang="ts">
  import { cn } from '../../../tools';
  import type { ReviewCommentSegment } from '../types';

  interface Props {
    segments: ReviewCommentSegment[];
    class?: string;
  }

  let { segments, class: className }: Props = $props();
</script>

<p
  data-slot="review-thread-card-body"
  class={cn('ui:mt-0.5 ui:text-sm ui:whitespace-pre-wrap ui:text-foreground ui:[overflow-wrap:anywhere]', className)}
>
  {#each segments as segment, index (index)}
    {#if segment.kind === 'mention'}
      <span
        class={cn(
          'ui:rounded ui:px-0.5',
          segment.inactive ? 'ui:text-muted-foreground' : 'ui:bg-primary/10 ui:font-medium ui:text-primary'
        )}>{segment.text}</span
      >
    {:else if segment.kind === 'link'}
      <a href={segment.href} target="_blank" rel="noopener noreferrer" class="ui:text-primary ui:underline"
        >{segment.text}</a
      >
    {:else}
      {segment.text}
    {/if}
  {/each}
</p>
