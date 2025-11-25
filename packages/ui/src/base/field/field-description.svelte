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
  data-slot="field-description"
  class={cn(
    'ui:text-muted-foreground ui:text-sm ui:font-normal ui:leading-normal ui:group-has-data-[orientation=horizontal]/field:text-balance',
    'ui:nth-last-2:-mt-1 ui:last:mt-0 ui:[[data-variant=legend]+&]:-mt-1.5',
    'ui:[&>a:hover]:text-primary ui:[&>a]:underline ui:[&>a]:underline-offset-4',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</p>
