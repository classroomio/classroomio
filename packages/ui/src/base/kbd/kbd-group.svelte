<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<kbd
  bind:this={ref}
  data-slot="kbd-group"
  class={cn('ui:inline-flex ui:items-center ui:gap-1', className)}
  {...restProps}
>
  {@render children?.()}
</kbd>
