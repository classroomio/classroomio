<script lang="ts">
  import { cn } from '../../tools';
  import { Button, type ButtonVariant } from '../../base/button';
  import type { LandingPrimaryAction } from './types';

  interface Props {
    action: LandingPrimaryAction;
    size?: 'default' | 'sm' | 'lg';
    variant?: ButtonVariant;
    class?: string;
  }

  let { action, size = 'default', variant = 'default', class: className = '' }: Props = $props();

  const isDisabled = $derived(action.disabled ?? false);

  // Match pricing CTA disabled appearance: theme hero color overrides must not win when enrollment is closed.
  const disabledClass =
    'ui:pointer-events-none ui:!opacity-50 ui:disabled:opacity-50 ui:aria-disabled:opacity-50' +
    ' ui:!bg-[var(--landing-button-primary-bg)] ui:!text-[var(--landing-button-primary-fg)]' +
    ' ui:hover:!bg-[var(--landing-button-primary-bg)] ui:hover:!opacity-50 ui:!border-transparent';
</script>

<Button
  href={action.onclick ? undefined : action.href}
  onclick={action.onclick}
  disabled={isDisabled}
  {size}
  {variant}
  class={cn(className, isDisabled && disabledClass)}
>
  {action.label}
</Button>
