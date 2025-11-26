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
<<<<<<< HEAD
  class={cn('text-muted-foreground mt-4 text-sm', className)}
=======
  class={cn('ui:text-muted-foreground ui:mt-4 ui:text-sm', className)}
>>>>>>> feat/release-v2
  {...restProps}
>
  {@render children?.()}
</caption>
