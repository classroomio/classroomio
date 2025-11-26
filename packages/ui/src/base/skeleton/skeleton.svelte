<script lang="ts">
  import { cn, type WithElementRef, type WithoutChildren } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="skeleton"
  class={cn('ui:bg-accent ui:animate-pulse ui:rounded-md', className)}
  {...restProps}
></div>
