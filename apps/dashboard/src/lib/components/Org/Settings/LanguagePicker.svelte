<script lang="ts">
  import { Dropdown } from 'carbon-components-svelte';
  import { t, initialized } from '$lib/utils/functions/translations';
  import { LANGUAGES } from '$lib/utils/constants/translation';
  import { LOCALE } from '$lib/utils/types';

  interface Props {
    className?: string;
    value?: LOCALE;
    hasLangChanged?: boolean;
    change?: () => void;
  }

  let { className = '', value = $bindable(LOCALE.EN), hasLangChanged = $bindable(false), change }: Props = $props();

  const dropdownItems = [{ id: '', text: 'Pick a Language' }, ...LANGUAGES];

  function handleSelect(event) {
    value = event.detail.selectedId;

    hasLangChanged = true;

    change?.();
  }
</script>

{#if $initialized}
  <Dropdown
    titleText={$t('content.toggle_label')}
    items={dropdownItems}
    selectedId={value}
    on:select={handleSelect}
    class="h-full {className}"
  />
{/if}
