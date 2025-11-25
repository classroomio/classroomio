<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  export const fieldVariants = tv({
    base: 'ui:group/field ui:data-[invalid=true]:text-destructive ui:flex ui:w-full ui:gap-3',
    variants: {
      orientation: {
        vertical: 'ui:flex-col ui:*:w-full ui:*.sr-only:w-auto',
        horizontal: [
          'ui:flex-row ui:items-center',
          '[&>[data-slot=field-label]]:flex-auto',
          'ui:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px ui:has-[>[data-slot=field-content]]:items-start'
        ],
        responsive: [
          '@md/field-group:ui:flex-row @md/field-group:ui:items-center @md/field-group:ui:[&>*]:w-auto ui:flex-col ui:*:w-full ui:*.sr-only:w-auto',
          '@md/field-group:ui:[&>[data-slot=field-label]]:flex-auto',
          '@md/field-group:ui:has-[>[data-slot=field-content]]:items-start @md/field-group:ui:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px'
        ]
      }
    },
    defaultVariants: {
      orientation: 'vertical'
    }
  });

  export type FieldOrientation = VariantProps<typeof fieldVariants>['orientation'];
</script>

<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    orientation = 'vertical',
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    orientation?: FieldOrientation;
  } = $props();
</script>

<div
  bind:this={ref}
  role="group"
  data-slot="field"
  data-orientation={orientation}
  class={cn(fieldVariants({ orientation }), className)}
  {...restProps}
>
  {@render children?.()}
</div>
