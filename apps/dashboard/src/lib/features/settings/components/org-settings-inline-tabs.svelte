<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';

  import { currentOrgPath } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';

  const orgSettingsTabs = [
    { value: 'general', href: '/settings/org', label: 'settings.auth.tabs.general' },
    {
      value: 'domains',
      href: '/settings/domains',
      label: 'settings.organization.organization_profile.custom_domain.heading'
    },
    { value: 'teams', href: '/settings/teams', label: 'settings.organization.organization_profile.team.heading' },
    { value: 'customize-lms', href: '/settings/customize-lms', label: 'settings.tabs.customize_lms_tab' }
  ] as const;

  function getCurrentTab(pathname: string) {
    if (pathname.endsWith('/settings/org')) return 'general';
    if (pathname.endsWith('/settings/customize-lms')) return 'customize-lms';
    if (pathname.endsWith('/settings/domains')) return 'domains';
    if (pathname.endsWith('/settings/teams')) return 'teams';

    return null;
  }

  let currentTab = $derived(getCurrentTab(page.url.pathname));

  function handleTabChange(value: string) {
    const nextTab = orgSettingsTabs.find((tab) => tab.value === value);

    if (!nextTab || value === currentTab) return;

    goto($currentOrgPath + nextTab.href);
  }
</script>

{#if currentTab}
  <div class="mb-6 px-2">
    <UnderlineTabs.Root value={currentTab} onValueChange={(event) => handleTabChange(event)}>
      <UnderlineTabs.List class="flex flex-wrap gap-2 border-b">
        {#each orgSettingsTabs as tab}
          <UnderlineTabs.Trigger value={tab.value}>
            {$t(tab.label)}
          </UnderlineTabs.Trigger>
        {/each}
      </UnderlineTabs.List>
    </UnderlineTabs.Root>
  </div>
{/if}
