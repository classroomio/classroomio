<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  export const itemVariants = tv({
    base: 'group/item ui:[a]:hover:bg-accent/50 ui:[a]:transition-colors ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:flex ui:flex-wrap ui:items-center ui:rounded-md ui:border ui:border-transparent ui:text-sm ui:outline-none ui:transition-colors ui:duration-100 ui:focus-visible:ring-[3px] ui:cursor-pointer',
    variants: {
      variant: {
        default: 'ui:bg-transparent',
        outline: 'ui:border-border',
        muted: 'ui:bg-muted/50'
      },
      size: {
        default: 'ui:gap-4 ui:p-4',
        sm: 'ui:gap-2.5 ui:px-4 ui:py-3'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  });

  export type ItemSize = VariantProps<typeof itemVariants>['size'];
  export type ItemVariant = VariantProps<typeof itemVariants>['variant'];
</script>

<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';

  let {
    ref = $bindable(null),
    class: className,
    child,
    variant,
    size,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    child?: Snippet<[{ props: Record<string, unknown> }]>;
    variant?: ItemVariant;
    size?: ItemSize;
  } = $props();

  const mergedProps = $derived({
    class: cn(itemVariants({ variant, size }), className),
    'data-slot': 'item',
    'data-variant': variant,
    'data-size': size,
    ...restProps
  });
</script>

{#if child}
  {@render child({ props: mergedProps })}
{:else}
  <div bind:this={ref} {...mergedProps}>
    {@render mergedProps.children?.()}
  </div>
{/if}
