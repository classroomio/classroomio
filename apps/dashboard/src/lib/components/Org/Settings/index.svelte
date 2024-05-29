<script>
  import { page } from '$app/stores';
  import { Tabs, Tab, TabContent } from 'carbon-components-svelte';
  import Profile from './Profile.svelte';
  import LandingpageSettings from './LandingpageSettings.svelte';
  // import Account from './Account.svelte';
  import OrgSettings from './OrgSettings.svelte';
  import Billing from './Billing.svelte';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import Integrations from './Integrations.svelte';
  import { t } from '$lib/utils/functions/translations';

  let selected = 0;
  let query = new URLSearchParams($page.url.search);
  let tabKey = query.get('tab') || '';

  let tabs = [];

  function getSelectedByTab(tabKey = '') {
    const tab = tabs.find((t) => t.tabKey === tabKey);

    return tab ? tab.key : 0;
  }
  function changeRouteOnTabChange(key = 0) {
    const tab = tabs.find((t) => t.key === key);
    if (tab) {
      goto(tab.href);
    }
  }

  onMount(() => {
    selected = getSelectedByTab(tabKey);
  });

  $: if (browser) {
    // query = new URLSearchParams($page.url.search);
    // tabKey = query.get('tab') || '';
    //   selected = getSelectedByTab(tabKey);
    changeRouteOnTabChange(selected);
  }

  $: {
    tabs = [
      {
        key: 0,
        label: $t('settings.tabs.profile_tab'),
        tabKey: '',
        href: $page.url.pathname,
        disabled: false
      },
      {
        key: 1,
        label: $t('settings.tabs.organization_tab'),
        tabKey: 'org',
        href: `${$page.url.pathname}?tab=org`,
        disabled: !$isOrgAdmin
      },
      {
        key: 2,
        label: $t('settings.tabs.landing_page_tab'),
        tabKey: 'landingpage',
        href: `${$page.url.pathname}?tab=landingpage`,
        disabled: !$isOrgAdmin
      },
      {
        key: 3,
        label: $t('settings.tabs.billing_tab'),
        tabKey: 'billing',
        href: `${$page.url.pathname}?tab=billing`,
        disabled: !$isOrgAdmin
      },
      {
        key: 4,
        label: $t('settings.tabs.integrations_tab'),
        tabKey: 'integrations',
        href: `${$page.url.pathname}?tab=integrations`,
        disabled: false
      }
    ];
  }
  $: console.log(tabKey);
</script>

<Tabs autoWidth bind:selected>
  {#each tabs as tab}
    <Tab label={tab.label} href={tab.href} disabled={tab.disabled} />
  {/each}
  <!-- <Tab label="Account" /> -->
  <svelte:fragment slot="content">
    <TabContent class="w-full p-0">
      <Profile />
    </TabContent>
    <!-- <TabContent>
      <Account />
    </TabContent> -->
    <TabContent class="w-full p-0">
      <OrgSettings />
    </TabContent>
    <TabContent class="w-full p-0">
      <LandingpageSettings />
    </TabContent>
    <TabContent class="w-full p-0">
      <Billing />
    </TabContent>
    <TabContent class="w-full p-0">
      <Integrations />
    </TabContent>
  </svelte:fragment>
</Tabs>
