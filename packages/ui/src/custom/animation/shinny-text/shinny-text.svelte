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
    'ui:mx-auto ui:max-w-md ui:text-neutral-600/50 ui:dark:text-neutral-400/50',
    'ui:animate-shimmer ui:bg-size-[var(--shimmer-width)_100%] ui:bg-clip-text ui:bg-position-[0_0] ui:bg-no-repeat [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]',
    'ui:bg-linear-to-r ui:from-transparent ui:via-black/80 ui:via-50% ui:to-transparent ui:dark:via-white/80',
    className
  )}
>
  {@render children?.()}
</p>
