<script lang="ts" module>
  import type { WithChildren, WithoutChildren } from 'bits-ui';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import { type VariantProps, tv } from 'tailwind-variants';

  export const buttonVariants = tv({
    base: "ui:aria-invalid:ring-destructive/20 ui:dark:aria-invalid:ring-destructive/40 ui:aria-invalid:border-destructive ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:relative ui:inline-flex ui:shrink-0 ui:items-center ui:justify-center ui:gap-2 ui:overflow-hidden ui:rounded-md ui:text-sm ui:font-medium ui:whitespace-nowrap ui:outline-hidden ui:transition-all ui:select-none ui:focus-visible:ring-[3px] ui:disabled:pointer-events-none ui:disabled:cursor-not-allowed ui:disabled:opacity-50 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0 ui:[&_svg:not([class*='size-'])]:size-4 ui:cursor-pointer",
    variants: {
      variant: {
        default: 'ui:bg-primary ui:text-primary-foreground ui:[a&]:hover:bg-primary/90 ui:shadow-2xs',
        'light-default': 'ui:bg-primary/20 ui:text-primary ui:[a&]:hover:bg-primary/30 ui:shadow-2xs',
        destructive:
          'ui:bg-destructive ui:[a&]:hover:bg-destructive/90 ui:focus-visible:ring-destructive/20 ui:dark:bg-destructive/60 ui:dark:focus-visible:ring-destructive/40 ui:text-white ui:shadow-2xs',
        outline:
          'ui:bg-background ui:[a&]:hover:bg-accent ui:[a&]:hover:text-accent-foreground ui:dark:border-input ui:dark:bg-input/30 ui:dark:hover:bg-input/50 ui:border ui:shadow-2xs',
        secondary: 'ui:bg-secondary ui:text-secondary-foreground ui:[a&]:hover:bg-secondary/80 ui:shadow-2xs',
        ghost: 'ui:[a&]:hover:bg-accent ui:[a&]:hover:text-accent-foreground ui:dark:[a&]:hover:bg-accent/50',
        'ghost-outline':
          'ui:bg-background ui:[a&]:hover:bg-accent ui:[a&]:hover:text-accent-foreground ui:dark:hover:border-input ui:dark:bg-input/30 ui:dark:hover:bg-input/50 ui:hover:border ui:hover:shadow-2xs',
        link: 'ui:text-primary ui:underline-offset-4 ui:[a&]:hover:underline'
      },
      size: {
        default: 'ui:h-9 ui:px-4 ui:py-2 ui:has-[>svg]:px-3',
        sm: 'ui:h-8 ui:gap-1.5 ui:rounded-md ui:px-3 ui:has-[>svg]:px-2.5',
        lg: 'ui:h-10 ui:rounded-md ui:px-6 ui:has-[>svg]:px-4',
        icon: 'ui:size-9',
        'icon-2xs': 'ui:size-4',
        'icon-xs': `ui:size-6`,
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

  export type ButtonPropsWithoutHTML = WithChildren<{
    ref?: HTMLElement | null;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    onClickPromise?: (
      e: MouseEvent & {
        currentTarget: EventTarget & HTMLButtonElement;
      }
    ) => Promise<void>;
  }>;

  export type AnchorElementProps = ButtonPropsWithoutHTML &
    WithoutChildren<Omit<HTMLAnchorAttributes, 'href' | 'type'>> & {
      href: HTMLAnchorAttributes['href'];
      type?: never;
      disabled?: HTMLButtonAttributes['disabled'];
    };

  export type ButtonElementProps = ButtonPropsWithoutHTML &
    WithoutChildren<Omit<HTMLButtonAttributes, 'type' | 'href'>> & {
      type?: HTMLButtonAttributes['type'];
      href?: never;
      disabled?: HTMLButtonAttributes['disabled'];
    };

  export type ButtonProps = AnchorElementProps | ButtonElementProps;
</script>

<script lang="ts">
  import { cn } from '../../tools';
  import { Spinner } from '../spinner';

  let {
    ref = $bindable(null),
    variant = 'default',
    size = 'default',
    href = undefined,
    type = 'button',
    loading = false,
    disabled = false,
    tabindex = 0,
    onclick,
    onClickPromise,
    class: className,
    children,
    ...rest
  }: ButtonProps = $props();
</script>

<!-- This approach to disabled links is inspired by bits-ui see: https://github.com/huntabyte/bits-ui/pull/1055 -->
<svelte:element
  this={href ? 'a' : 'button'}
  {...rest}
  data-slot="button"
  type={href ? undefined : type}
  href={href && !disabled ? href : undefined}
  disabled={href ? undefined : disabled || loading}
  aria-disabled={href ? disabled : undefined}
  role={href && disabled ? 'link' : undefined}
  tabindex={href && disabled ? -1 : tabindex}
  class={cn(buttonVariants({ variant, size }), className)}
  bind:this={ref}
  onclick={async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    e: any
  ) => {
    onclick?.(e);

    if (type === undefined) return;

    if (onClickPromise) {
      loading = true;

      await onClickPromise(e);

      loading = false;
    }
  }}
>
  {#if type !== undefined && loading}
    <div class="ui:absolute ui:flex ui:size-full ui:place-items-center ui:justify-center ui:bg-inherit">
      <div class="ui:flex ui:place-items-center ui:justify-center">
        <Spinner class="custom ui:size-4" />
      </div>
    </div>
    <span class="ui:sr-only">Loading</span>
  {/if}

  {#if loading && size.includes('icon')}
    <span class="ui:sr-only">Loading</span>
  {:else}
    {@render children?.()}
  {/if}
</svelte:element>
