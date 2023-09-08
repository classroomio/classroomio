<script>
  import { page } from '$app/stores';
  import { Tabs, Tab, TabContent } from 'carbon-components-svelte';
  import Profile from './Profile.svelte';
  import LandingpageSettings from './LandingpageSettings.svelte';
  // import Account from './Account.svelte';
  import OrgSettings from './OrgSettings.svelte';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';

  let selected = 0;
  let query = new URLSearchParams($page.url.search);
  let tabKey = query.get('tab') || '';

  const tabs = [
    {
      key: 0,
      label: 'Profile',
      tabKey: '',
      href: $page.url.pathname
    },
    {
      key: 1,
      label: 'Organization',
      tabKey: 'org',
      href: `${$page.url.pathname}?tab=org`
    },
    {
      key: 2,
      label: 'LandingPage',
      tabKey: 'landingpage',
      href: `${$page.url.pathname}?tab=landingpage`
    }
  ];

  function getSelectedByTab(tabKey = '') {
    const tab = tabs.find((t) => t.tabKey === tabKey);

    return tab ? tab.key : 0;
  }
  function changeRouteOnTabChange(key = 0) {
    const tab = tabs.find((t) => t.key === key);
    if (tab) {
      return goto(tab.href);
    }
  }

  onMount(() => {
    selected = getSelectedByTab(tabKey);
  });

  $: {
    if (browser) {
      changeRouteOnTabChange(selected);
    }
  }
</script>

<Tabs autoWidth bind:selected>
  {#each tabs as tab}
    <Tab label={tab.label} href={tab.href} />
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
  </svelte:fragment>
</Tabs>
