<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLHeadingElement>> = $props();
</script>

<h1
  bind:this={ref}
  data-slot="page-title"
  class={cn('ui:text-2xl ui:font-normal ui:tracking-tight', className)}
  {...restProps}
>
  {@render children?.()}
</h1>
