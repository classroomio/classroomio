<script lang="ts">
  import type { HTMLTableAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLTableAttributes> = $props();
</script>

<<<<<<< HEAD
<div data-slot="table-container" class="relative w-full overflow-x-auto">
  <table bind:this={ref} data-slot="table" class={cn('w-full caption-bottom text-sm', className)} {...restProps}>
=======
<div data-slot="table-container" class="ui:relative ui:w-full ui:overflow-x-auto">
  <table bind:this={ref} data-slot="table" class={cn('ui:w-full ui:text-sm caption-bottom', className)} {...restProps}>
>>>>>>> feat/release-v2
    {@render children?.()}
  </table>
</div>
