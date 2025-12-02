<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  export const buttonGroupVariants = tv({
    base: "ui:flex ui:w-fit ui:items-stretch ui:has-[>[data-slot=button-group]]:gap-2 ui:[&>*]:focus-visible:relative ui:[&>*]:focus-visible:z-10 ui:has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-e-md ui:[&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit ui:[&>input]:flex-1",
    variants: {
      orientation: {
        horizontal:
          'ui:[&>*:not(:first-child)]:rounded-s-none ui:[&>*:not(:first-child)]:border-s-0 ui:[&>*:not(:last-child)]:rounded-e-none',
        vertical:
          'ui:flex-col ui:[&>*:not(:first-child)]:rounded-t-none ui:[&>*:not(:first-child)]:border-t-0 ui:[&>*:not(:last-child)]:rounded-b-none'
      }
    },
    defaultVariants: {
      orientation: 'horizontal'
    }
  });

  export type ButtonGroupOrientation = VariantProps<typeof buttonGroupVariants>['orientation'];
</script>

<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    orientation = 'horizontal',
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    orientation?: ButtonGroupOrientation;
  } = $props();
</script>

<div
  bind:this={ref}
  role="group"
  data-slot="button-group"
  data-orientation={orientation}
  class={cn(buttonGroupVariants({ orientation }), className)}
  {...restProps}
>
  {@render children?.()}
</div>
