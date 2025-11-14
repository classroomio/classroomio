<script>
  import { page } from '$app/state';
  import * as Tabs from '@cio/ui/base/tabs';

  import { t } from '$lib/utils/functions/translations';

  import Profile from '$lib/components/LMS/components/Profile.svelte';
  import Integrations from '$lib/components/Org/Settings/Integrations.svelte';

  let selectedTab = $state('profile');

  const tabs = $derived([
    {
      key: 'profile',
      label: $t('settings.tabs.profile_tab'),
      href: page.url.pathname
    },
    {
      key: 'integrations',
      label: $t('settings.tabs.integrations_tab'),
      href: `${page.url.pathname}?tab=integrations`,
      disabled: false
    }
  ]);
</script>

<section class="mx-auto w-full max-w-6xl">
  <div class="px-5 py-10">
    <div class="mb-10 flex items-center justify-between">
      <h1 class="text-3xl dark:text-white">{$t('settings.heading')}</h1>
    </div>

    <div class="">
      <Tabs.Root bind:value={selectedTab}>
        <Tabs.List>
          {#each tabs as tab}
            <Tabs.Trigger value={tab.key}>{tab.label}</Tabs.Trigger>
          {/each}
        </Tabs.List>
        <Tabs.Content value="profile">
          <Profile />
        </Tabs.Content>
        <Tabs.Content value="integrations">
          <Integrations />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  </div>
</section>
