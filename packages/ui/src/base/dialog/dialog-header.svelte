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
  data-slot="dialog-header"
<<<<<<< HEAD
  class={cn('flex flex-col gap-2 text-center sm:text-left', className)}
=======
  class={cn('ui:flex ui:flex-col ui:gap-2 ui:text-center ui:sm:text-left', className)}
>>>>>>> feat/release-v2
  {...restProps}
>
  {@render children?.()}
</div>
