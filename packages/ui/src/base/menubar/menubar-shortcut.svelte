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
  class={cn('ui:text-muted-foreground ui:ml-auto ui:text-xs ui:tracking-widest', className)}
  {...restProps}
>
  {@render children?.()}
</span>
