<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="alert-description"
  class={cn(
    'ui:text-muted-foreground ui:col-start-2 ui:grid ui:justify-items-start ui:gap-1 ui:text-sm ui:[&_p]:leading-relaxed',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>
