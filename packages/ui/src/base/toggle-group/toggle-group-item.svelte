<script lang="ts" module>
  import { type VariantProps, tv } from 'tailwind-variants';

  export const toggleGroupItemVariants = tv({
    base: "ui:hover:bg-muted ui:hover:text-muted-foreground ui:data-[state=on]:bg-accent ui:data-[state=on]:text-accent-foreground ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:aria-invalid:ring-destructive/20 ui:dark:aria-invalid:ring-destructive/40 ui:aria-invalid:border-destructive ui:inline-flex ui:items-center ui:justify-center ui:gap-2 ui:rounded-md ui:text-sm ui:font-medium ui:whitespace-nowrap ui:transition-[color,box-shadow] ui:outline-none ui:focus-visible:ring-[3px] ui:disabled:pointer-events-none ui:disabled:opacity-50 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0 ui:[&_svg:not([class*='ui:size-'])]:size-4",
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

  export type ToggleGroupItemVariant = VariantProps<typeof toggleGroupItemVariants>['variant'];
  export type ToggleGroupItemSize = VariantProps<typeof toggleGroupItemVariants>['size'];
  export type ToggleGroupItemVariants = VariantProps<typeof toggleGroupItemVariants>;
</script>

<script lang="ts">
  import { getContext } from 'svelte';
  import { ToggleGroup as ToggleGroupPrimitive } from 'bits-ui';
  import { cn } from '../../tools';
  import { TOGGLE_GROUP_CONTEXT, type ToggleGroupContextValue } from './toggle-group-context';

  const toggleGroupContext = getContext<ToggleGroupContextValue | undefined>(TOGGLE_GROUP_CONTEXT);

  let {
    ref = $bindable(null),
    class: className,
    variant = undefined,
    size = undefined,
    ...restProps
  }: ToggleGroupPrimitive.ItemProps & {
    variant?: ToggleGroupItemVariant;
    size?: ToggleGroupItemSize;
  } = $props();

  const resolvedVariant = $derived(
    (variant ?? toggleGroupContext?.getVariant() ?? 'default') as ToggleGroupItemVariant
  );
  const resolvedSize = $derived((size ?? toggleGroupContext?.getSize() ?? 'default') as ToggleGroupItemSize);
</script>

<ToggleGroupPrimitive.Item
  bind:ref
  data-slot="toggle-group-item"
  class={cn(toggleGroupItemVariants({ variant: resolvedVariant, size: resolvedSize }), className)}
  {...restProps}
/>
