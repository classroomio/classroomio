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
  data-slot="card-action"
  class={cn('ui:col-start-2 ui:row-span-2 ui:row-start-1 ui:self-start ui:justify-self-end', className)}
  {...restProps}
>
  {@render children?.()}
</div>
