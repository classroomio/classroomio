<script lang="ts">
  import { cn } from '../../tools';
  import LandingButton from './landing-button.svelte';
  import type { LandingPrimaryAction } from './types';

  type LandingButtonVariant = 'primary' | 'secondary' | 'tertiary';
  type LandingButtonSize = 'sm' | 'md' | 'lg';

  interface Props {
    action: LandingPrimaryAction;
    size?: 'default' | 'sm' | 'lg';
    variant?: LandingButtonVariant;
    class?: string;
  }

  let { action, size = 'default', variant = 'primary', class: className = '' }: Props = $props();

  const landingSize = $derived<LandingButtonSize>(size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md');
  const isDisabled = $derived(action.disabled ?? false);

  // Match pricing CTA disabled appearance: theme hero color overrides must not win when enrollment is closed.
  const disabledClass =
    'ui:pointer-events-none ui:!opacity-50 ui:disabled:opacity-50 ui:aria-disabled:opacity-50' +
    ' ui:!bg-[var(--landing-button-primary-bg)] ui:!text-[var(--landing-button-primary-fg)]' +
    ' ui:hover:!bg-[var(--landing-button-primary-bg)] ui:hover:!opacity-50 ui:!border-transparent';
</script>

<LandingButton
  {variant}
  size={landingSize}
  href={action.onclick ? undefined : action.href}
  onclick={action.onclick}
  disabled={isDisabled}
  class={cn(className, isDisabled && disabledClass)}
>
  {action.label}
</LandingButton>
