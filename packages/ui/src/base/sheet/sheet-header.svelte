<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '../../../src/tools';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="sheet-header"
  class={cn('ui:flex ui:flex-col ui:gap-1.5 ui:p-4', className)}
  {...restProps}
>
  {@render children?.()}
</div>
