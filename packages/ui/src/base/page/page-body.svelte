<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';

  let {
    ref = $bindable(null),
    class: className,
    child,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    child?: Snippet;
  } = $props();
</script>

<div
  bind:this={ref}
  data-slot="page-body"
  class={cn('ui:flex-1 ui:flex ui:gap-4 ui:flex-col ui:mb-4', className)}
  {...restProps}
>
  {#if child}
    {@render child()}
  {/if}
</div>
