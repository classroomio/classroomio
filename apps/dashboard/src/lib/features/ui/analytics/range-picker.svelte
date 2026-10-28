<script lang="ts" generics="TValue extends string | number">
  import LockIcon from '@lucide/svelte/icons/lock';
  import { Button } from '@cio/ui/base/button';

  interface Props {
    value: TValue;
    options: ReadonlyArray<{ value: TValue; label: string; locked?: boolean }>;
    label: string;
    onChange: (value: TValue) => void;
    onLocked?: (value: TValue) => void;
    lockedHint?: string;
    disabled?: boolean;
    testId?: string;
  }

  let { value, options, label, onChange, onLocked, lockedHint, disabled = false, testId }: Props = $props();

  function handleClick(option: { value: TValue; locked?: boolean }) {
    if (option.locked && onLocked) {
      onLocked(option.value);
      return;
    }

    onChange(option.value);
  }
</script>

<div
  class="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-md border p-1 md:flex-nowrap md:gap-1"
  role="group"
  aria-label={label}
  data-testid={testId}
>
  {#each options as option (option.value)}
    <Button
      type="button"
      variant={value === option.value ? 'default' : 'ghost'}
      size="xs"
      class="px-2 text-[11px] whitespace-nowrap sm:px-2.5 sm:text-xs"
      aria-pressed={value === option.value}
      aria-label={option.locked && lockedHint ? `${option.label} — ${lockedHint}` : undefined}
      title={option.locked ? lockedHint : undefined}
      onclick={() => handleClick(option)}
      {disabled}
    >
      {#if option.locked}
        <LockIcon class="ui:size-3" aria-hidden="true" />
      {/if}
      {option.label}
    </Button>
  {/each}
</div>
