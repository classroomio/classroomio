<script lang="ts">
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
  import { cn, type WithElementRef, type WithoutChildren } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> = $props();
</script>

<span
  bind:this={ref}
  aria-hidden="true"
  data-slot="pagination-ellipsis"
<<<<<<< HEAD
  class={cn('flex size-9 items-center justify-center', className)}
  {...restProps}
>
  <EllipsisIcon class="size-4" />
=======
  class={cn('ui:flex ui:size-9 ui:items-center ui:justify-center', className)}
  {...restProps}
>
  <EllipsisIcon class="ui:size-4" />
>>>>>>> feat/release-v2
  <span class="sr-only">More pages</span>
</span>
