<script lang="ts">
  import { cn } from '../../../tools';
  import type { Snippet } from 'svelte';

  interface Props {
    shimmerWidth?: number;
    class?: string;
    children?: Snippet;
  }

  let { shimmerWidth = 100, class: className, children }: Props = $props();
</script>

<p
  style:--shimmer-width="{shimmerWidth}px"
  class={cn(
    'mx-auto max-w-md text-neutral-600/50 dark:text-neutral-400/50',
    'animate-shimmer bg-size-[var(--shimmer-width)_100%] bg-clip-text bg-position-[0_0] bg-no-repeat [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]',
    'bg-linear-to-r from-transparent via-black/80 via-50% to-transparent dark:via-white/80',
    className
  )}
>
  {@render children?.()}
</p>
