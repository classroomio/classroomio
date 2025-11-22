<script lang="ts">
  import { cn } from '../../tools';
  import { type WithElementRef } from 'bits-ui';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    inset,
    children,
    class: className,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> & {
    inset?: boolean;
  } = $props();
</script>

<div
  bind:this={ref}
  data-slot="menubar-label"
  data-inset={inset}
  class={cn('ui:px-2 ui:py-1.5 ui:text-sm ui:font-medium ui:data-[inset]:pl-8', className)}
  {...restProps}
>
  {@render children?.()}
</div>
