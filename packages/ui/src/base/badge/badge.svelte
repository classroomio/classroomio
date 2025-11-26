<script lang="ts" module>
  import { type VariantProps, tv } from 'tailwind-variants';

  export const badgeVariants = tv({
<<<<<<< HEAD
    base: 'focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3',
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90 border-transparent',
        secondary: 'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 border-transparent',
        destructive:
          'bg-destructive [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/70 border-transparent text-white',
        outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground'
=======
    base: 'ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:aria-invalid:ring-destructive/20 ui:dark:aria-invalid:ring-destructive/40 ui:aria-invalid:border-destructive ui:inline-flex ui:w-fit ui:shrink-0 ui:items-center ui:justify-center ui:gap-1 ui:overflow-hidden ui:whitespace-nowrap ui:rounded-full ui:border ui:px-2 ui:py-0.5 ui:text-xs ui:font-medium ui:transition-[color,box-shadow] ui:focus-visible:ring-[3px] ui:[&>svg]:pointer-events-none ui:[&>svg]:size-3',
    variants: {
      variant: {
        default: 'ui:bg-primary ui:text-primary-foreground ui:[a&]:hover:bg-primary/90 ui:border-transparent',
        secondary: 'ui:bg-secondary ui:text-secondary-foreground ui:[a&]:hover:bg-secondary/90 ui:border-transparent',
        destructive:
          'ui:bg-destructive ui:[a&]:hover:bg-destructive/90 ui:focus-visible:ring-destructive/20 ui:dark:focus-visible:ring-destructive/40 ui:dark:bg-destructive/70 ui:border-transparent ui:text-white',
        outline: 'ui:text-foreground ui:[a&]:hover:bg-accent ui:[a&]:hover:text-accent-foreground'
>>>>>>> feat/release-v2
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  });

  export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
</script>

<script lang="ts">
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '../../tools';

  let {
    ref = $bindable(null),
    href,
    class: className,
    variant = 'default',
    children,
    ...restProps
  }: WithElementRef<HTMLAnchorAttributes> & {
    variant?: BadgeVariant;
  } = $props();
</script>

<svelte:element
  this={href ? 'a' : 'span'}
  bind:this={ref}
  data-slot="badge"
  {href}
  class={cn(badgeVariants({ variant }), className)}
  {...restProps}
>
  {@render children?.()}
</svelte:element>
