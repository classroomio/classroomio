<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  export const emptyMediaVariants = tv({
    base: 'ui:mb-2 ui:flex ui:shrink-0 ui:items-center ui:justify-center ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0',
    variants: {
      variant: {
        default: 'ui:bg-transparent',
        icon: "ui:bg-muted ui:text-foreground ui:flex ui:size-10 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-lg ui:[&_svg:not([class*='ui:size-'])]:size-6"
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  });

  export type EmptyMediaVariant = VariantProps<typeof emptyMediaVariants>['variant'];
</script>

<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    variant = 'default',
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & { variant?: EmptyMediaVariant } = $props();
</script>

<div
  bind:this={ref}
  data-slot="empty-icon"
  data-variant={variant}
  class={cn(emptyMediaVariants({ variant }), className)}
  {...restProps}
>
  {@render children?.()}
</div>
