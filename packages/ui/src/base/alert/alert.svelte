<script lang="ts" module>
  import { type VariantProps, tv } from 'tailwind-variants';

  export const alertVariants = tv({
    base: 'ui:relative ui:grid ui:w-full ui:grid-cols-[0_1fr] ui:items-start ui:gap-y-0.5 ui:rounded-lg ui:border ui:px-4 ui:py-3 ui:text-sm ui:has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] ui:has-[>svg]:gap-x-3 ui:[&>svg]:size-4 ui:[&>svg]:translate-y-0.5 ui:[&>svg]:text-current',
    variants: {
      variant: {
        default: 'ui:bg-card ui:text-card-foreground',
        destructive:
          'ui:text-destructive ui:bg-card *:data-[slot=alert-description]:text-destructive/90 ui:[&>svg]:text-current',
        warning:
          'ui:border-amber-200 ui:bg-amber-50 ui:text-amber-900 ui:dark:border-amber-900 ui:dark:bg-amber-950 ui:dark:text-amber-50 ui:[&>svg]:text-current',
        information:
          'ui:border-sky-200 ui:bg-sky-50 ui:text-sky-900 ui:dark:border-sky-900 ui:dark:bg-sky-950 ui:dark:text-sky-50 ui:[&>svg]:text-current'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  });

  export type AlertVariant = VariantProps<typeof alertVariants>['variant'];
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    variant = 'default',
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    variant?: AlertVariant;
  } = $props();
</script>

<div bind:this={ref} data-slot="alert" role="alert" class={cn(alertVariants({ variant }), className)} {...restProps}>
  {@render children?.()}
</div>
