<script lang="ts">
  import { Button, type ButtonVariant } from '../../base/button';
  import type { LandingPrimaryAction } from './types';

  interface Props {
    action: LandingPrimaryAction;
    size?: 'default' | 'sm' | 'lg';
    variant?: ButtonVariant;
    class?: string;
  }

  let { action, size = 'default', variant = 'default', class: className = '' }: Props = $props();
</script>

<Button
  href={action.onclick ? undefined : action.href}
  onclick={action.onclick}
  disabled={action.disabled ?? false}
  {size}
  {variant}
  class={className}
>
  {action.label}
</Button>
