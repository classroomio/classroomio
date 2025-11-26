<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="dialog-footer"
<<<<<<< HEAD
  class={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
=======
  class={cn('ui:flex ui:flex-col-reverse ui:gap-2 ui:sm:flex-row ui:sm:justify-end', className)}
>>>>>>> feat/release-v2
  {...restProps}
>
  {@render children?.()}
</div>
