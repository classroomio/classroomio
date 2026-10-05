<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import { cn } from '@cio/ui/tools';

  type Variant = 'primary' | 'secondary' | 'inverse' | 'outlineOnDark' | 'link';
  type Size = 'sm' | 'md' | 'lg';

  type Props = Omit<HTMLAnchorAttributes & HTMLButtonAttributes, 'class' | 'children'> & {
    variant?: Variant;
    size?: Size;
    href?: string;
    arrow?: boolean;
    class?: string;
    children?: Snippet;
  };

  let {
    variant = 'primary',
    size = 'md',
    href,
    arrow = false,
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  const VARIANT_CLASS: Record<Variant, string> = {
    primary: 'border border-transparent bg-blue-700 text-white hover:brightness-[0.94]',
    secondary: 'border border-gray-200 bg-white text-gray-950 hover:brightness-[0.97]',
    inverse: 'border border-transparent bg-white text-blue-700 hover:brightness-[0.94]',
    outlineOnDark: 'border border-white/40 bg-transparent text-white hover:bg-white/10',
    link: 'border-0 bg-transparent p-0 text-blue-700'
  };

  const SIZE_CLASS: Record<Size, string> = {
    sm: 'h-8 px-3',
    md: 'h-9 px-4',
    lg: 'h-10 px-6'
  };

  const sizeClass = $derived(variant === 'link' ? '' : SIZE_CLASS[size]);
  const buttonClass = $derived(
    cn(
      'group/cta inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm text-sm leading-tight font-medium no-underline transition-[filter,background-color]',
      sizeClass,
      VARIANT_CLASS[variant],
      className
    )
  );
</script>

<svelte:element this={href ? 'a' : 'button'} {href} type={href ? undefined : 'button'} class={buttonClass} {...rest}>
  {@render children?.()}
  {#if arrow}
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
      class="ease-out-soft transition-transform group-hover/cta:translate-x-0.5"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  {/if}
</svelte:element>
