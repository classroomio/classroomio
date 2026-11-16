<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../../../tools';

  interface Props {
    /** For example "Resolved by Ada · 2 h ago". */
    statusLabel?: string | null;
    /** Resolve or Reopen button. */
    children?: Snippet;
    class?: string;
  }

  let { statusLabel = null, children, class: className }: Props = $props();
</script>

<div
  data-slot="review-thread-card-footer"
  class={cn(
    'ui:mt-2 ui:flex ui:items-center ui:justify-between ui:gap-2 ui:border-t ui:border-border ui:pt-2',
    className
  )}
>
  <span class="ui:text-xs ui:text-success">{statusLabel ?? ''}</span>
  {@render children?.()}
</div>
