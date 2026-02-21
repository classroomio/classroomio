<script lang="ts">
  import * as InputGroup from '../../base/input-group';
  import SearchIcon from '@lucide/svelte/icons/search';
  import type { ComponentProps } from 'svelte';
  import { cn } from '../../tools';

  interface Props {
    placeholder?: string;
    value?: string;
    class?: string;
  }

  let {
    placeholder = '',
    value = $bindable(''),
    class: className = '',
    ...restProps
  }: Props & Omit<ComponentProps<typeof InputGroup.Root>, 'class' | 'children'> = $props();

  const mergedProps = $derived({
    class: cn('ui:w-fit ui:max-w-[200px]', className),
    'data-slot': 'search',
    ...restProps
  });
</script>

<InputGroup.Root {...mergedProps}>
  <InputGroup.Input {placeholder} bind:value />
  <InputGroup.Addon>
    <SearchIcon />
  </InputGroup.Addon>
</InputGroup.Root>
