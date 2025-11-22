<script lang="ts" module>
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import { type VariantProps, tv } from 'tailwind-variants';
  import { Spinner } from '../spinner';

  export const buttonVariants = tv({
    base: "ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:aria-invalid:ring-destructive/20 ui:dark:aria-invalid:ring-destructive/40 ui:aria-invalid:border-destructive ui:inline-flex ui:shrink-0 ui:items-center ui:justify-center ui:gap-2 ui:whitespace-nowrap ui:rounded-md ui:text-sm ui:font-medium ui:outline-none ui:transition-all ui:focus-visible:ring-[3px] ui:disabled:pointer-events-none ui:disabled:opacity-50 ui:aria-disabled:pointer-events-none ui:aria-disabled:opacity-50 ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0",
    variants: {
      variant: {
        default: 'ui:bg-primary ui:text-primary-foreground ui:shadow-xs ui:hover:bg-primary/90',
        destructive:
          'ui:bg-destructive ui:shadow-xs ui:hover:bg-destructive/90 ui:focus-visible:ring-destructive/20 ui:dark:focus-visible:ring-destructive/40 ui:dark:bg-destructive/60 ui:text-white',
        outline:
          'ui:bg-background ui:shadow-xs ui:hover:bg-accent ui:hover:text-accent-foreground ui:dark:bg-input/30 ui:dark:border-input ui:dark:hover:bg-input/50 ui:border',
        secondary: 'ui:bg-secondary ui:text-secondary-foreground ui:shadow-xs ui:hover:bg-secondary/80',
        ghost: 'ui:hover:bg-accent ui:hover:text-accent-foreground ui:dark:hover:bg-accent/50',
        link: 'ui:text-primary ui:underline-offset-4 ui:hover:underline'
      },
      size: {
        default: 'ui:h-9 ui:px-4 ui:py-2 ui:has-[>svg]:px-3',
        sm: 'ui:h-8 ui:gap-1.5 ui:rounded-md ui:px-3 ui:has-[>svg]:px-2.5',
        lg: 'ui:h-10 ui:rounded-md ui:px-6 ui:has-[>svg]:px-4',
        icon: 'ui:size-9',
        'icon-sm': 'ui:size-8',
        'icon-lg': 'ui:size-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  });

  export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
  export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

  export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
    WithElementRef<HTMLAnchorAttributes> & {
      variant?: ButtonVariant;
      size?: ButtonSize;
      isLoading?: boolean;
    };
</script>

<script lang="ts">
  let {
    class: className,
    variant = 'default',
    size = 'default',
    ref = $bindable(null),
    href = undefined,
    isLoading = false,
    type = 'button',
    children,
    ...restProps
  }: ButtonProps = $props();

  let disabled = $derived(restProps.disabled || isLoading);
</script>

{#if href}
  <a
    bind:this={ref}
    data-slot="button"
    class={cn(buttonVariants({ variant, size }), className)}
    href={disabled ? undefined : href}
    aria-disabled={disabled}
    role={disabled ? 'link' : undefined}
    tabindex={disabled ? -1 : undefined}
    {...restProps}
  >
    {#if isLoading}
      <Spinner />
    {/if}
    {@render children?.()}
  </a>
{:else}
  <button
    bind:this={ref}
    data-slot="button"
    class={cn(buttonVariants({ variant, size }), className)}
    {type}
    {disabled}
    {...restProps}
  >
    {#if isLoading}
      <Spinner />
    {/if}
    {@render children?.()}
  </button>
{/if}
