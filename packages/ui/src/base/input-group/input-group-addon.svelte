<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  export const inputGroupAddonVariants = tv({
    base: "ui:text-muted-foreground ui:flex ui:h-auto ui:cursor-text ui:select-none ui:items-center ui:justify-center ui:gap-2 ui:py-1.5 ui:text-sm ui:font-medium ui:group-data-[disabled=true]/input-group:opacity-50 ui:[&>kbd]:rounded-[calc(var(--radius)-5px)] ui:[&>svg:not([class*='ui:size-'])]:size-4",
    variants: {
      align: {
        'inline-start': 'ui:order-first ui:ps-3 ui:has-[>button]:ms-[-0.45rem] ui:has-[>kbd]:ms-[-0.35rem]',
        'inline-end': 'ui:order-last ui:pe-3 ui:has-[>button]:me-[-0.45rem] ui:has-[>kbd]:me-[-0.35rem]',
        'block-start':
          'ui:[.border-b]:pb-3 ui:order-first ui:w-full ui:justify-start ui:px-3 ui:pt-3 ui:group-has-[>input]/input-group:pt-2.5',
        'block-end':
          'ui:[.border-t]:pt-3 ui:order-last ui:w-full ui:justify-start ui:px-3 ui:pb-3 ui:group-has-[>input]/input-group:pb-2.5'
      }
    },
    defaultVariants: {
      align: 'inline-start'
    }
  });

  export type InputGroupAddonAlign = VariantProps<typeof inputGroupAddonVariants>['align'];
</script>

<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    align = 'inline-start',
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    align?: InputGroupAddonAlign;
  } = $props();
</script>

<div
  bind:this={ref}
  role="group"
  data-slot="input-group-addon"
  data-align={align}
  class={cn(inputGroupAddonVariants({ align }), className)}
  onclick={(e) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    e.currentTarget.parentElement?.querySelector('input')?.focus();
  }}
  {...restProps}
>
  {@render children?.()}
</div>
