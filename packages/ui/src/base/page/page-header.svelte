<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';
  import { Separator } from '../separator';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div bind:this={ref} data-slot="page-header" class={cn('ui:flex ui:flex-col ui:gap-4', className)} {...restProps}>
  <div class="ui:flex ui:items-start ui:justify-between ui:gap-4">
    {@render children?.()}
  </div>
  <Separator orientation="horizontal" />
</div>
