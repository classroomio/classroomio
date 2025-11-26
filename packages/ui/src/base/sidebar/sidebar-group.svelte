<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="sidebar-group"
  data-sidebar="group"
<<<<<<< HEAD
  class={cn('relative flex w-full min-w-0 flex-col p-2', className)}
=======
  class={cn('ui:relative ui:flex ui:w-full ui:min-w-0 ui:flex-col ui:p-2', className)}
>>>>>>> feat/release-v2
  {...restProps}
>
  {@render children?.()}
</div>
