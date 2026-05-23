<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'primary' | 'secondary' | 'tertiary';
  type Size = 'sm' | 'md' | 'lg';

  interface Props {
    variant?: Variant;
    size?: Size;
    href?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    onclick?: (event: MouseEvent) => void;
    class?: string;
    children: Snippet;
    'aria-label'?: string;
  }

  let {
    variant = 'primary',
    size = 'md',
    href,
    disabled = false,
    type = 'button',
    onclick,
    class: extraClass = '',
    children,
    'aria-label': ariaLabel
  }: Props = $props();

  const sizeClass = $derived(
    size === 'sm'
      ? 'ui:px-3 ui:py-1.5 ui:text-sm'
      : size === 'lg'
        ? 'ui:px-6 ui:py-3 ui:text-base'
        : 'ui:px-4 ui:py-2 ui:text-sm'
  );

  const variantClass = $derived(
    variant === 'primary'
      ? 'ui:bg-[var(--landing-button-primary-bg)] ui:text-[var(--landing-button-primary-fg)] ui:hover:bg-[var(--landing-button-primary-bg-hover)] ui:border-transparent'
      : variant === 'secondary'
        ? 'ui:bg-[var(--landing-button-secondary-bg)] ui:text-[var(--landing-button-secondary-fg)] ui:hover:bg-[var(--landing-button-secondary-bg-hover)] ui:border-[var(--landing-button-secondary-border)]'
        : 'ui:bg-transparent ui:text-[var(--landing-button-tertiary-fg)] ui:hover:bg-[var(--landing-button-tertiary-bg-hover)] ui:border-transparent'
  );

  const baseClass =
    'ui:inline-flex ui:items-center ui:justify-center ui:gap-1.5 ui:rounded-md ui:font-medium ui:border ui:transition-colors ui:focus-visible:outline-none ui:focus-visible:ring-2 ui:focus-visible:ring-[var(--landing-accent)]/50 ui:disabled:opacity-50 ui:disabled:cursor-not-allowed ui:cursor-pointer ui:no-underline ui:whitespace-nowrap';

  const finalClass = $derived(`${baseClass} ${sizeClass} ${variantClass} ${extraClass}`);
</script>

{#if href && !disabled}
  <a {href} class={finalClass} aria-label={ariaLabel} {onclick}>
    {@render children()}
  </a>
{:else}
  <button {type} class={finalClass} {disabled} {onclick} aria-label={ariaLabel}>
    {@render children()}
  </button>
{/if}
