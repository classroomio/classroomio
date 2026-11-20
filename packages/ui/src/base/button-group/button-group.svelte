<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  export const buttonGroupVariants = tv({
    base: "ui:flex ui:w-fit ui:items-stretch ui:has-[>[data-slot=button-group]]:gap-2 ui:[&>*]:focus-visible:relative ui:[&>*]:focus-visible:z-10 ui:has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-e-md ui:[&>[data-slot=select-trigger]:not([class*='ui:w-'])]:w-fit ui:[&>input]:flex-1",
    variants: {
      orientation: {
        horizontal: '',
        vertical: 'ui:flex-col'
      },
      variant: {
        default: '',
        toolbar:
          'ui:border-border ui:bg-background ui:gap-0.5 ui:rounded-md ui:border ui:p-0.5 ui:[&>[data-slot=button]]:rounded-sm ui:[&>[data-slot=button]]:bg-transparent ui:[&>[data-slot=button]]:shadow-none ui:[&>[data-slot=button]:focus-visible]:bg-secondary ui:[&>[data-slot=button]:hover:not(:disabled)]:bg-secondary'
      }
    },
    compoundVariants: [
      {
        variant: 'default',
        orientation: 'horizontal',
        class:
          'ui:[&>*:not(:first-child)]:rounded-s-none ui:[&>*:not(:first-child)]:border-s-0 ui:[&>*:not(:last-child)]:rounded-e-none'
      },
      {
        variant: 'default',
        orientation: 'vertical',
        class:
          'ui:[&>*:not(:first-child)]:rounded-t-none ui:[&>*:not(:first-child)]:border-t-0 ui:[&>*:not(:last-child)]:rounded-b-none'
      }
    ],
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'default'
    }
  });

  export type ButtonGroupOrientation = VariantProps<typeof buttonGroupVariants>['orientation'];
  export type ButtonGroupVariant = VariantProps<typeof buttonGroupVariants>['variant'];
</script>

<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    orientation = 'horizontal',
    variant = 'default',
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    orientation?: ButtonGroupOrientation;
    variant?: ButtonGroupVariant;
  } = $props();
</script>

<div
  bind:this={ref}
  role="group"
  data-slot="button-group"
  data-orientation={orientation}
  class={cn(buttonGroupVariants({ orientation, variant }), className)}
  {...restProps}
>
  {@render children?.()}
</div>
