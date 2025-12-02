<script lang="ts">
  import * as InputGroup from '../../base/input-group';
  import * as Tooltip from '../../base/tooltip';
  import LockIcon from '@lucide/svelte/icons/lock';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import EyeOffIcon from '@lucide/svelte/icons/eye-off';
  import type { ComponentProps } from 'svelte';
  import { cn } from '../../tools';

  interface Props {
    placeholder?: string;
    value?: string;
    class?: string;
    disabled?: boolean;
    'aria-invalid'?: 'true' | 'false' | undefined;
    autocomplete?: string;
    showPasswordTooltip?: string;
    hidePasswordTooltip?: string;
    showPasswordAriaLabel?: string;
    hidePasswordAriaLabel?: string;
  }

  let {
    placeholder = '************',
    value = $bindable(''),
    class: className = '',
    disabled = false,
    'aria-invalid': ariaInvalid,
    autocomplete,
    showPasswordTooltip = 'Show password',
    hidePasswordTooltip = 'Hide password',
    showPasswordAriaLabel = 'Show password',
    hidePasswordAriaLabel = 'Hide password',
    ...restProps
  }: Props & Omit<ComponentProps<typeof InputGroup.Root>, 'class' | 'children'> = $props();

  let showPassword = $state(false);

  const tooltipText = $derived(showPassword ? hidePasswordTooltip : showPasswordTooltip);
  const ariaLabel = $derived(showPassword ? hidePasswordAriaLabel : showPasswordAriaLabel);
</script>

<InputGroup.Root class={cn('w-full', className)} data-slot="password">
  <InputGroup.Addon align="inline-start">
    <LockIcon />
  </InputGroup.Addon>
  <InputGroup.Input
    type={showPassword ? 'text' : 'password'}
    {placeholder}
    bind:value
    {disabled}
    aria-invalid={ariaInvalid}
    autocomplete={autocomplete}
    {...restProps}
  />
  <InputGroup.Addon align="inline-end">
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <InputGroup.Button
              {...props}
              onclick={() => (showPassword = !showPassword)}
              aria-label={ariaLabel}
              {disabled}
            >
              {#if showPassword}
                <EyeOffIcon />
              {:else}
                <EyeIcon />
              {/if}
            </InputGroup.Button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content>{tooltipText}</Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  </InputGroup.Addon>
</InputGroup.Root>

