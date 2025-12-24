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
  data-slot="page"
  class={cn('ui:flex ui:flex-col ui:gap-4 ui:min-h-[calc(100vh-48px)] ui:w-full', className)}
  {...restProps}
>
  {@render children?.()}
</div>
