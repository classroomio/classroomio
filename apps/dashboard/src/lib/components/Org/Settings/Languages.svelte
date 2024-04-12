<script>
  import { Dropdown } from 'carbon-components-svelte';
  import { t, locale, initialized } from '$lib/utils/functions/translations';
  import { supabase } from '$lib/utils/functions/supabase';

  let value = 'en';
  let userId = '';
  let selectedId = '';
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

  export async function handleLocaleChange(newValue) {
    value = newValue;
    $locale = value;
    await fetch('/api/i18n', {
      body: JSON.stringify({ locale: $locale }),
      method: 'POST'
    });
  }

  // function to get user profile
  async function getUser() {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const { user: authUser } = session || {};

    if (authUser) {
      userId = authUser.id;
    }
  }

  // function get lang
  async function updateLang() {
    await getUser();

    let { error } = await supabase
      .from('profile')
      .update({ language: selectedId })
      .eq('id', userId);
    if (error) {
      console.log('Error updating language', error.message);
    }
  }

  function handleSelect(event) {
    const newSelectedId = event.detail.selectedId;
    selectedId = newSelectedId;
    handleLocaleChange(selectedId);
    updateLang();
  }
</script>

<div class="mt-5">
  {#if $initialized}
    <div class="flex flex-row gap-5 items-center h-[10%]">
      <span>{$t('content.toggle_label')}: </span>
      <Dropdown
        items={dropdownItems}
        {selectedId}
        on:select={handleSelect}
        class="w-[30%] h-full"
      />
    </div>
  {/if}
</div>
