<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  const inputGroupButtonVariants = tv({
    base: 'ui:flex ui:items-center ui:gap-2 ui:text-sm ui:shadow-none',
    variants: {
      size: {
        xs: "ui:h-6 ui:gap-1 ui:rounded-[calc(var(--radius)-5px)] ui:px-2 ui:has-[>svg]:px-2 ui:[&>svg:not([class*='ui:size-'])]:size-3.5",
        sm: 'ui:h-8 ui:gap-1.5 ui:rounded-md ui:px-2.5 ui:has-[>svg]:px-2.5',
        'icon-xs': 'ui:size-6 ui:rounded-[calc(var(--radius)-5px)] ui:p-0 ui:has-[>svg]:p-0',
        'icon-sm': 'ui:size-8 ui:p-0 ui:has-[>svg]:p-0'
      }
    },
    defaultVariants: {
      size: 'xs'
    }
  });

  export type InputGroupButtonSize = VariantProps<typeof inputGroupButtonVariants>['size'];
</script>

<script lang="ts">
  import { cn } from '../../tools';
  import type { ComponentProps } from 'svelte';
  import { Button } from '../button';

  let {
    ref = $bindable(null),
    class: className,
    children,
    type = 'button',
    variant = 'ghost',
    size = 'xs',
    ...restProps
  }: Omit<ComponentProps<typeof Button>, 'href' | 'size'> & {
    size?: InputGroupButtonSize;
  } = $props();
</script>

<Button
  bind:ref
  {type}
  data-size={size}
  {variant}
  class={cn(inputGroupButtonVariants({ size }), className)}
  {...restProps}
>
  {@render children?.()}
</Button>
