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
  data-slot="drawer-footer"
  class={cn('ui:mt-auto ui:flex ui:flex-col ui:gap-2 ui:p-4', className)}
  {...restProps}
>
  {@render children?.()}
</div>
