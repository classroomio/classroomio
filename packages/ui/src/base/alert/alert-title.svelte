<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="alert-title"
  class={cn('ui:col-start-2 ui:min-h-4 ui:font-medium ui:tracking-tight line-clamp-1', className)}
  {...restProps}
>
  {@render children?.()}
</div>
