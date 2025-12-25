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

<caption
  bind:this={ref}
  data-slot="table-caption"
  class={cn('ui:text-muted-foreground ui:mt-4 ui:text-sm', className)}
  {...restProps}
>
  {@render children?.()}
</caption>
