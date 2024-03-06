<script>
  import { Dropdown } from 'carbon-components-svelte';
  import { t, locale, initialized } from '$lib/utils/functions/translations';

  let value = 'en';

  async function handleLocaleChange(newValue) {
    value = newValue;
    $locale = value;
    await fetch('/api', {
      body: JSON.stringify({ locale: $locale }),
      method: 'POST'
    });
  }

  // function getCurrencyCode() {
  //   switch ($locale) {
  //     case 'en':
  //       return 'USD';
  //     case 'hi':
  //       return 'INR';
  //     default:
  //       return 'USD';
  //   }
  // }

  let dropdownItems = [
    { id: 'en', text: 'English' },
    { id: 'hi', text: 'Hindi' },
    { id: 'fr', text: 'French' }
  ];

  let selectedId = 'en';

  function handleSelect(event) {
    const newSelectedId = event.detail.selectedId;
    selectedId = newSelectedId;
    handleLocaleChange(selectedId);
  }
</script>

<div class="mt-5">
  {#if $initialized}
    <div class="flex flex-row gap-5 items-center">
      <span>{$t('content.toggle_label')}: </span>
      <Dropdown items={dropdownItems} {selectedId} on:select={handleSelect} class="w-[30%]" />
    </div>
  {/if}
</div>
