<script>
  import { page } from '$app/stores';
  import { Tabs, Tab, TabContent } from 'carbon-components-svelte';
  import Profile from '$lib/components/LMS/components/Profile.svelte';
  import Integrations from '$lib/components/Org/Settings/Integrations.svelte';
  import { t } from '$lib/utils/functions/translations';

  let selected = 0;
  let tabs = [];
  $: tabs = [
    {
      key: 0,
      label: $t('settings.tabs.tabs_1'),
      tabKey: '',
      href: $page.url.pathname
    },
    {
      key: 1,
      label: $t('settings.tabs.tabs_5'),
      tabKey: 'integrations',
      href: `${$page.url.pathname}?tab=integrations`,
      disabled: false
    }
  ];
</script>

<section class="w-full max-w-6xl mx-auto">
  <div class="py-10 px-5">
    <div class="flex items-center justify-between mb-10">
      <h1 class="dark:text-white text-3xl font-bold">{$t('settings.heading')}</h1>
    </div>

    <div class="">
      <Tabs autoWidth bind:selected>
        {#each tabs as tab}
          <Tab label={tab.label} href={tab.href} />
        {/each}
        <svelte:fragment slot="content">
          <TabContent>
            <Profile />
          </TabContent>
          <TabContent>
            <Integrations />
          </TabContent>
        </svelte:fragment>
      </Tabs>
    </div>
  </div>
</section>
