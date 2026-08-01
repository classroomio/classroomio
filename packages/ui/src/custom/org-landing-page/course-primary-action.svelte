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

  const disabledClass = $derived(
    variant === 'secondary'
      ? 'ui:!bg-[var(--landing-button-secondary-bg)] ui:!text-[var(--landing-button-secondary-fg)] ui:hover:!bg-[var(--landing-button-secondary-bg)]'
      : variant === 'tertiary'
        ? 'ui:!bg-transparent ui:!text-[var(--landing-button-tertiary-fg)] ui:hover:!bg-transparent'
        : 'ui:!bg-[var(--landing-button-primary-bg)] ui:!text-[var(--landing-button-primary-fg)] ui:hover:!bg-[var(--landing-button-primary-bg)]'
  );
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
