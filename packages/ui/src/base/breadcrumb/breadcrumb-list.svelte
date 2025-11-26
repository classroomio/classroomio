<script lang="ts">
  import type { HTMLOlAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '../../tools';

  let { ref = $bindable(null), class: className, children, ...restProps }: WithElementRef<HTMLOlAttributes> = $props();
</script>

<ol
  bind:this={ref}
  data-slot="breadcrumb-list"
<<<<<<< HEAD
  class={cn('text-muted-foreground flex flex-wrap items-center gap-1.5 break-words text-sm sm:gap-2.5', className)}
=======
  class={cn(
    'ui:text-muted-foreground ui:flex ui:flex-wrap ui:items-center ui:gap-1.5 ui:break-words ui:text-sm ui:sm:gap-2.5',
    className
  )}
>>>>>>> feat/release-v2
  {...restProps}
>
  {@render children?.()}
</ol>
