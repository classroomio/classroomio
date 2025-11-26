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
  data-slot="menubar-shortcut"
<<<<<<< HEAD
  class={cn('text-muted-foreground ml-auto text-xs tracking-widest', className)}
=======
  class={cn('ui:text-muted-foreground ui:ml-auto ui:text-xs ui:tracking-widest', className)}
>>>>>>> feat/release-v2
  {...restProps}
>
  {@render children?.()}
</span>
