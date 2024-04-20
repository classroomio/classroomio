<script>
  import { Dropdown } from 'carbon-components-svelte';
  import { t, initialized } from '$lib/utils/functions/translations';
  import { LANGUAGES } from '$lib/utils/constants/translation';
  import { LOCALE } from '$lib/utils/types';

  export let className = '';
  export let value = LOCALE.EN;
  export let hasLangChanged = false;

  const dropdownItems = [{ id: '', text: 'Pick a Language' }, ...LANGUAGES];

  function handleSelect(event) {
    value = event.detail.selectedId;

    hasLangChanged = true;
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
