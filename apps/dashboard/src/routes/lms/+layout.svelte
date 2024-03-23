<script>
  import { onMount } from 'svelte';
  import LMSSideBar from '$lib/components/LMS/SideBar.svelte';
  import { locale } from '$lib/utils/functions/translations';
  import { supabase } from '$lib/utils/functions/supabase';

  let userId;
  let userLang = '';
  let defaultLang = 'en';

  // function to set the default value of the languages
  async function handleLocaleChange(newLang) {
    defaultLang = newLang;
    $locale = defaultLang;
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
  async function getLang() {
    await getUser();

    let { data, error } = await supabase.from('profile').select('*').eq('id', userId).single();
    if (!error) {
      userLang = data.language;
    }

    handleLocaleChange(userLang);
  }

  onMount(() => {
    getLang();
  });
</script>

<div class="org-root w-full flex items-center justify-between">
  <LMSSideBar />
  <div class="org-slot bg-white dark:bg-black w-full">
    <slot />
  </div>
</div>
