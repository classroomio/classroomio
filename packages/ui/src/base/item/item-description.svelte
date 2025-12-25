<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLParagraphElement>> = $props();
</script>

<p
  bind:this={ref}
  data-slot="item-description"
  class={cn(
    'ui:text-muted-foreground ui:line-clamp-3 ui:text-balance ui:text-sm ui:font-normal ui:leading-normal',
    'ui:[&>a:hover]:text-primary ui:[&>a]:underline ui:[&>a]:underline-offset-4',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</p>
