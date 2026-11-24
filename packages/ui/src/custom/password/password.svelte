<script lang="ts">
  import * as InputGroup from '../../base/input-group';
  import * as Tooltip from '../../base/tooltip';
  import LockIcon from '@lucide/svelte/icons/lock';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import EyeOffIcon from '@lucide/svelte/icons/eye-off';
  import type { ComponentProps } from 'svelte';
  import { cn } from '../../tools';

  type PasswordInputAutocomplete = ComponentProps<typeof InputGroup.Input>['autocomplete'];

  interface Props {
    placeholder?: string;
    value?: string;
    class?: string;
    disabled?: boolean;
    showStrength?: boolean;
    showLockIcon?: boolean;
    'aria-invalid'?: 'true' | 'false' | undefined;
    autocomplete?: PasswordInputAutocomplete;
    showPasswordTooltip?: string;
    hidePasswordTooltip?: string;
    showPasswordAriaLabel?: string;
    hidePasswordAriaLabel?: string;
    strengthLabel?: string;
  }

  let {
    placeholder = '************',
    value = $bindable(''),
    class: className = '',
    disabled = false,
    showStrength = false,
    showLockIcon = true,
    'aria-invalid': ariaInvalid,
    autocomplete,
    showPasswordTooltip = 'Show password',
    hidePasswordTooltip = 'Hide password',
    showPasswordAriaLabel = 'Show password',
    hidePasswordAriaLabel = 'Hide password',
    strengthLabel = 'Password strength',
    ...restProps
  }: Props & Omit<ComponentProps<typeof InputGroup.Root>, 'class' | 'children'> = $props();

  let showPassword = $state(false);

  const strengthScore = $derived.by(() => {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[^a-zA-Z]/.test(value)) score += 1;
    if (value.length >= 12) score += 1;

    return score;
  });

  const tooltipText = $derived(showPassword ? hidePasswordTooltip : showPasswordTooltip);
  const ariaLabel = $derived(showPassword ? hidePasswordAriaLabel : showPasswordAriaLabel);
</script>

<InputGroup.Root class={cn('ui:w-full', className)} data-slot="password">
  {#if showLockIcon}
    <InputGroup.Addon align="inline-start">
      <LockIcon />
    </InputGroup.Addon>
  {/if}
  <InputGroup.Input
    type={showPassword ? 'text' : 'password'}
    {placeholder}
    bind:value
    {disabled}
    aria-invalid={ariaInvalid}
    {autocomplete}
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

{#if showStrength}
  <div
    class="ui:mt-2 ui:flex ui:gap-1"
    role="meter"
    aria-label={strengthLabel}
    aria-valuemin={0}
    aria-valuemax={3}
    aria-valuenow={strengthScore}
  >
    {#each [1, 2, 3] as bar (bar)}
      <span
        class={cn(
          'ui:h-[3px] ui:flex-1 ui:rounded-full ui:transition-[background-color] ui:motion-reduce:transition-none',
          bar > strengthScore && 'ui:bg-muted',
          bar <= strengthScore && strengthScore === 1 && 'ui:bg-muted-foreground/45',
          bar <= strengthScore && strengthScore > 1 && 'ui:bg-primary'
        )}
      ></span>
    {/each}
  </div>
{/if}
