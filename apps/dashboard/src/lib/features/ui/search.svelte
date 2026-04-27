<script lang="ts">
  import * as Kbd from '@cio/ui/base/kbd';
  import * as InputGroup from '@cio/ui/base/input-group';
  import SearchIcon from '@lucide/svelte/icons/search';
  import type { ComponentProps } from 'svelte';
  import { t } from '$lib/utils/functions/translations';
  import { searchStore } from '$features/search/store/search-store.svelte';
  import type { SearchScope } from '$features/search/utils/types';

  interface Props {
    placeholder?: string;
    value?: string;
    class?: string;
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    onKeydown?: (event: KeyboardEvent) => void;
    scope?: SearchScope;
  }

  let {
    placeholder = '',
    value = $bindable(''),
    class: className = '',
    onFocus,
    onBlur,
    onKeydown,
    scope = 'org',
    ...restProps
  }: Props & Omit<ComponentProps<typeof InputGroup.Root>, 'class' | 'children'> = $props();

  function openCommandPalette() {
    searchStore.open(scope);
  }

  function handleFocus(event: FocusEvent) {
    onFocus?.(event);
    openCommandPalette();
  }

  function handlePointerdown(event: PointerEvent) {
    event.preventDefault();
    openCommandPalette();
  }

  function handleKeydown(event: KeyboardEvent) {
    onKeydown?.(event);

    if (event.key === 'Tab') {
      return;
    }

    event.preventDefault();
    openCommandPalette();
  }
</script>

<InputGroup.Root class={`hidden! max-w-56 md:flex! ${className}`} onpointerdown={handlePointerdown} {...restProps}>
  <InputGroup.Input
    placeholder={placeholder || $t('app.search.placeholder')}
    bind:value
    readonly
    role="button"
    aria-haspopup="dialog"
    on:focus={handleFocus}
    on:blur={onBlur}
    on:keydown={handleKeydown}
  />
  <InputGroup.Addon>
    <SearchIcon />
  </InputGroup.Addon>
  <InputGroup.Addon align="inline-end">
    <Kbd.Root>⌘</Kbd.Root>
    <Kbd.Root>K</Kbd.Root>
  </InputGroup.Addon>
</InputGroup.Root>
