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
<<<<<<< HEAD
  class={cn('px-2 py-1.5 text-sm font-medium data-[inset]:pl-8', className)}
=======
  class={cn('ui:px-2 ui:py-1.5 ui:text-sm ui:font-medium ui:data-[inset]:pl-8', className)}
>>>>>>> feat/release-v2
  {...restProps}
>
  {@render children?.()}
</div>
