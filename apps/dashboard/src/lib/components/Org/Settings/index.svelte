<script lang="ts">
  import { page } from '$app/state';
  import * as Tabs from '@cio/ui/base/tabs';

  import Profile from './Profile.svelte';
  import Billing from './Billing.svelte';
  import { goto } from '$app/navigation';
  import OrgSettings from './OrgSettings.svelte';
  import Integrations from './Integrations.svelte';
  import LandingpageSettings from './LandingpageSettings.svelte';
  // import Account from './Account.svelte';

  import { isOrgAdmin } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';

  interface TabItem {
    key: number;
    label: string;
    tabKey: string;
    href: string;
    disabled: boolean;
  }

  let query = $derived(new URLSearchParams(page.url.search));
  let tabKey = $derived(query.get('tab') || '');

  let tabs: TabItem[] = $derived([
    {
      key: 0,
      label: $t('settings.tabs.profile_tab'),
      tabKey: '',
      href: page.url.pathname,
      disabled: false
    },
    {
      key: 1,
      label: $t('settings.tabs.organization_tab'),
      tabKey: 'org',
      href: `${page.url.pathname}?tab=org`,
      disabled: !$isOrgAdmin
    },
    {
      key: 2,
      label: $t('settings.tabs.landing_page_tab'),
      tabKey: 'landingpage',
      href: `${page.url.pathname}?tab=landingpage`,
      disabled: !$isOrgAdmin
    },
    {
      key: 3,
      label: $t('settings.tabs.billing_tab'),
      tabKey: 'billing',
      href: `${page.url.pathname}?tab=billing`,
      disabled: !$isOrgAdmin
    },
    {
      key: 4,
      label: $t('settings.tabs.integrations_tab'),
      tabKey: 'integrations',
      href: `${page.url.pathname}?tab=integrations`,
      disabled: false
    }
  ]);

  function onTabChange(value: string) {
    const tab = tabs.find((t) => t.tabKey === value);
    if (tab) {
      goto(tab.href);
    }
  }
</script>

<Tabs.Root value={tabKey} onValueChange={onTabChange} class="w-full">
  <Tabs.List class="w-full">
    {#each tabs as tab}
      <Tabs.Trigger value={tab.tabKey} disabled={tab.disabled}>
        {tab.label}
      </Tabs.Trigger>
    {/each}
  </Tabs.List>

  <Tabs.Content value="" class="w-full p-0">
    <Profile />
  </Tabs.Content>

  <Tabs.Content value="org" class="w-full p-0">
    <OrgSettings />
  </Tabs.Content>

  <Tabs.Content value="landingpage" class="w-full p-0">
    <LandingpageSettings />
  </Tabs.Content>

  <Tabs.Content value="billing" class="w-full p-0">
    <Billing />
  </Tabs.Content>

  <Tabs.Content value="integrations" class="w-full p-0">
    <Integrations />
  </Tabs.Content>
</Tabs.Root>
