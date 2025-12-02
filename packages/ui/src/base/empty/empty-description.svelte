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
  data-slot="empty-description"
  class={cn(
    'ui:text-muted-foreground ui:[&>a:hover]:text-primary ui:text-sm/relaxed ui:[&>a]:underline ui:[&>a]:underline-offset-4',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>
