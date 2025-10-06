<script>
  import { page } from '$app/state';
  import { Tabs, Tab, TabContent } from 'carbon-components-svelte';
  import Profile from '$lib/components/LMS/components/Profile.svelte';
  import Integrations from '$lib/components/Org/Settings/Integrations.svelte';
  import { t } from '$lib/utils/functions/translations';

  let selected = $state(0);
  let tabs = $state([]);
  $effect(() => {
    tabs = [
      {
        key: 0,
        label: $t('settings.tabs.profile_tab'),
        tabKey: '',
        href: page.url.pathname
      },
      {
        key: 1,
        label: $t('settings.tabs.integrations_tab'),
        tabKey: 'integrations',
        href: `${page.url.pathname}?tab=integrations`,
        disabled: false
      }
    ];
  });
</script>

<section class="mx-auto w-full max-w-6xl">
  <div class="px-5 py-10">
    <div class="mb-10 flex items-center justify-between">
      <h1 class="text-3xl font-bold dark:text-white">{$t('settings.heading')}</h1>
    </div>

    <div class="">
      <Tabs autoWidth bind:selected>
        {#each tabs as tab}
          <Tab label={tab.label} href={tab.href} />
        {/each}
        {#snippet content()}
          <TabContent>
            <Profile />
          </TabContent>
          <TabContent>
            <Integrations />
          </TabContent>
        {/snippet}
      </Tabs>
    </div>
  </div>
</section>
