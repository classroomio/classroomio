<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<span
  bind:this={ref}
  data-slot="breadcrumb-page"
  role="link"
  aria-disabled="true"
  aria-current="page"
<<<<<<< HEAD
  class={cn('text-foreground font-normal', className)}
=======
  class={cn('ui:text-foreground ui:font-normal', className)}
>>>>>>> feat/release-v2
  {...restProps}
>
  {@render children?.()}
</span>
