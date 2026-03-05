<script lang="ts">
  import * as Kbd from '@cio/ui/base/kbd';
  import * as InputGroup from '@cio/ui/base/input-group';
  import SearchIcon from '@lucide/svelte/icons/search';
  import type { ComponentProps } from 'svelte';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    placeholder?: string;
    value?: string;
    class?: string;
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    onKeydown?: (event: KeyboardEvent) => void;
  }

  let {
    placeholder = '',
    value = $bindable(''),
    class: className = '',
    onFocus,
    onBlur,
    onKeydown,
    ...restProps
  }: Props & Omit<ComponentProps<typeof InputGroup.Root>, 'class' | 'children'> = $props();
</script>

<InputGroup.Root class={`hidden! max-w-56 md:flex! ${className}`} {...restProps}>
  <InputGroup.Input
    placeholder={placeholder || $t('app.search.placeholder')}
    bind:value
    on:focus={onFocus}
    on:blur={onBlur}
    on:keydown={onKeydown}
  />
  <InputGroup.Addon>
    <SearchIcon />
  </InputGroup.Addon>
  <InputGroup.Addon align="inline-end">
    <Kbd.Root>⌘</Kbd.Root>
    <Kbd.Root>K</Kbd.Root>
  </InputGroup.Addon>
</InputGroup.Root>
