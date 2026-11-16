<script lang="ts">
  import type { Snippet } from 'svelte';
  import LinkIcon from '@lucide/svelte/icons/link';
  import { cn } from '../../../tools';

  interface Props {
    /** Anchor chip and status tags. */
    children: Snippet;
    copyLinkLabel?: string;
    onCopyLink?: () => void;
    class?: string;
  }

  let { children, copyLinkLabel, onCopyLink, class: className }: Props = $props();
</script>

<div
  data-slot="review-thread-card-header"
  class={cn('ui:mb-2 ui:flex ui:flex-wrap ui:items-center ui:gap-1.5', className)}
>
  {@render children()}
  {#if copyLinkLabel && onCopyLink}
    <button
      type="button"
      class="ui:ml-auto ui:inline-flex ui:items-center ui:gap-1 ui:text-xs ui:text-muted-foreground ui:hover:text-foreground ui:hover:underline"
      onclick={onCopyLink}
    >
      <LinkIcon class="ui:size-3" aria-hidden="true" />
      {copyLinkLabel}
    </button>
  {/if}
</div>
