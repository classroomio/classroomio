<script>
  import { Dropdown } from 'carbon-components-svelte';
  import { t, initialized } from '$lib/utils/functions/translations';

  export let className = '';
  export let value = 'en';
  export let hasLangChanged = false;

  let dropdownItems = [
    { id: '', text: 'Pick a Language' },
    { id: 'en', text: 'English' },
    { id: 'hi', text: 'Hindi' },
    { id: 'fr', text: 'French' },
    { id: 'pt', text: 'Portuguese' },
    { id: 'de', text: 'German' },
    { id: 'vi', text: 'Vietnamese' },
    { id: 'ru', text: 'Russian' },
    { id: 'es', text: 'Spanish' }
  ];

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
