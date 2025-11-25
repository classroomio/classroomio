<script lang="ts" module>
  import { type VariantProps, tv } from 'tailwind-variants';

  export const toggleVariants = tv({
    base: "ui:hover:bg-muted ui:hover:text-muted-foreground ui:data-[state=on]:bg-accent ui:data-[state=on]:text-accent-foreground ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:aria-invalid:ring-destructive/20 ui:dark:aria-invalid:ring-destructive/40 ui:aria-invalid:border-destructive ui:inline-flex ui:items-center ui:justify-center ui:gap-2 ui:rounded-md ui:text-sm ui:font-medium ui:whitespace-nowrap ui:transition-[color,box-shadow] ui:outline-none ui:focus-visible:ring-[3px] ui:disabled:pointer-events-none ui:disabled:opacity-50 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0 ui:[&_svg:not([class*='size-'])]:size-4",
    variants: {
      variant: {
        default: 'ui:bg-transparent',
        outline:
          'ui:border-input ui:hover:bg-accent ui:hover:text-accent-foreground ui:border ui:bg-transparent ui:shadow-xs'
      },
      size: {
        default: 'ui:h-9 ui:min-w-9 ui:px-2',
        sm: 'ui:h-8 ui:min-w-8 ui:px-1.5',
        lg: 'ui:h-10 ui:min-w-10 ui:px-2.5'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  });

  export type ToggleVariant = VariantProps<typeof toggleVariants>['variant'];
  export type ToggleSize = VariantProps<typeof toggleVariants>['size'];
  export type ToggleVariants = VariantProps<typeof toggleVariants>;
</script>

<script lang="ts">
  import { Toggle as TogglePrimitive } from 'bits-ui';
  import { cn } from '../../tools';

  let {
    ref = $bindable(null),
    pressed = $bindable(false),
    class: className,
    size = 'default',
    variant = 'default',
    ...restProps
  }: TogglePrimitive.RootProps & {
    variant?: ToggleVariant;
    size?: ToggleSize;
  } = $props();
</script>

<TogglePrimitive.Root
  bind:ref
  bind:pressed
  data-slot="toggle"
  class={cn(toggleVariants({ variant, size }), className)}
  {...restProps}
/>
