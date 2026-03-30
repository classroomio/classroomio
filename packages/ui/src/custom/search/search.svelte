<script lang="ts">
  import * as InputGroup from '../../base/input-group';
  import SearchIcon from '@lucide/svelte/icons/search';
  import XIcon from '@lucide/svelte/icons/x';
  import type { ComponentProps } from 'svelte';
  import { cn } from '../../tools';

  interface Props {
    placeholder?: string;
    value?: string;
    class?: string;
    onValueChange?: (value: string) => void;
  }

  let {
    placeholder = '',
    value = $bindable(''),
    class: className = '',
    onValueChange,
    ...restProps
  }: Props & Omit<ComponentProps<typeof InputGroup.Root>, 'class' | 'children'> = $props();

  const mergedProps = $derived({
    class: cn('ui:w-fit ui:max-w-[200px]', className),
    'data-slot': 'search',
    ...restProps
  });

  function handleInput(event: Event) {
    onValueChange?.((event.currentTarget as HTMLInputElement).value);
  }

  function clearValue() {
    value = '';
    onValueChange?.('');
  }
</script>

<InputGroup.Root {...mergedProps}>
  <InputGroup.Input {placeholder} bind:value oninput={handleInput} />
  {#if value}
    <InputGroup.Addon align="inline-end">
      <InputGroup.Button aria-label="Clear search" onclick={clearValue}>
        <XIcon />
      </InputGroup.Button>
    </InputGroup.Addon>
  {/if}
  <InputGroup.Addon>
    <SearchIcon />
  </InputGroup.Addon>
</InputGroup.Root>
