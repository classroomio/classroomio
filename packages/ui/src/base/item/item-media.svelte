<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  export const itemMediaVariants = tv({
    base: 'ui:flex ui:shrink-0 ui:items-center ui:justify-center ui:gap-2 ui:group-has-[[data-slot=item-description]]/item:translate-y-0.5 ui:group-has-[[data-slot=item-description]]/item:self-start ui:[&_svg]:pointer-events-none',
    variants: {
      variant: {
        default: 'ui:bg-transparent',
        icon: "ui:bg-muted ui:size-8 ui:rounded-sm ui:border ui:[&_svg:not([class*='size-'])]:size-4",
        image: 'ui:size-10 ui:overflow-hidden ui:rounded-sm ui:[&_img]:size-full ui:[&_img]:object-cover'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  });

  export type ItemMediaVariant = VariantProps<typeof itemMediaVariants>['variant'];
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
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & { variant?: ItemMediaVariant } = $props();
</script>

<div
  bind:this={ref}
  data-slot="item-media"
  data-variant={variant}
  class={cn(itemMediaVariants({ variant }), className)}
  {...restProps}
>
  {@render children?.()}
</div>
