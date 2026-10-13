<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { currentOrg, currentOrgPath, isOrgAdmin } from '$lib/utils/store/org';
  import { page } from '$app/state';
  import { t } from '$lib/utils/functions/translations';
  import { IS_AI_ENABLED } from '$lib/utils/constants/ai';
  import { BackButton } from '@cio/ui';
  import Search from '$features/ui/search.svelte';
  import { isActive } from '$lib/utils/functions/app';
  import { pluginsApi } from '$features/plugins/api/plugins.svelte';
  import type { ResolvedContributionItem } from '$features/plugins/utils/types';

  const groups = [
    {
      label: 'settings.sidebar.personal',
      items: [
        { key: 'settings.tabs.profile_tab', path: '/settings' },
        { key: 'settings.tabs.notifications_tab', path: '/settings/notifications' }
      ]
    },
    {
      label: 'settings.sidebar.workspace',
      items: [
        { key: 'settings.sidebar.branding', path: '/settings/org' },
        { key: 'settings.tabs.domains_tab', path: '/settings/domains' },
        { key: 'settings.tabs.teams_tab', path: '/settings/teams' },
        { key: 'settings.tabs.customize_lms_tab', path: '/settings/customize-lms' },
        { key: 'settings.tabs.emails_tab', path: '/settings/emails', isNew: true },
        { key: 'settings.tabs.billing_tab', path: '/settings/billing' }
      ]
    },
    {
      label: 'settings.sidebar.extensions',
      items: [
        ...(IS_AI_ENABLED
          ? [
              { key: 'settings.tabs.ai_tutor_tab', path: '/settings/ai-tutor' },
              { key: 'settings.tabs.ai_credits_tab', path: '/settings/ai-credits' }
            ]
          : []),
        { key: 'settings.tabs.auth_tab', path: '/settings/auth' }
      ]
    }
  ];

  const currentPath = $derived($currentOrgPath);
  let pluginNavigation = $state<ResolvedContributionItem[]>([]);
  let listedOrganizationId = '';

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || !$isOrgAdmin || listedOrganizationId === organizationId) return;

    listedOrganizationId = organizationId;
    void pluginsApi.listOrgContributions(organizationId, 'organization.settings').then((result) => {
      if ($currentOrg.id === organizationId) pluginNavigation = result;
    });
  });
</script>

<Sidebar.Root collapsible="offcanvas" class="border-r">
  <Sidebar.Header class="gap-2">
    <div class="flex items-center justify-between gap-1">
      <BackButton href={currentPath} label={t.get('org_navigation.back_to_app')} class="min-w-0 px-2! py-2!" />
      <Sidebar.Trigger testId="settings-sidebar-trigger" />
    </div>
    <Search compact placeholder={t.get('settings.sidebar.search')} />
  </Sidebar.Header>
  <Sidebar.Content>
    {#each groups as group (group.label)}
      <Sidebar.Group class="px-2! pt-0!">
        <Sidebar.GroupLabel>{t.get(group.label)}</Sidebar.GroupLabel>
        <Sidebar.Menu>
          {#each group.items as item (item.path)}
            {@const href = `${currentPath}${item.path}`}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                isActive={isActive(page.url.pathname, href, undefined, item.path !== '/settings/auth')}
              >
                {#snippet child({ props })}
                  <a {href} {...props}>
                    {t.get(item.key)}
                    {#if 'isNew' in item}
                      <Sidebar.MenuBadge class="ui:text-primary ui:bg-primary/10">
                        {t.get('settings.sidebar.new_badge')}
                      </Sidebar.MenuBadge>
                    {/if}
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
          {#if group.label === 'settings.sidebar.extensions'}
            {#each pluginNavigation as item (item.installationId + item.contributionId)}
              {@const href = `${currentPath}/settings/plugins/${item.pluginId}/${item.page}`}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton isActive={isActive(page.url.pathname, href)}>
                  {#snippet child({ props })}
                    <a {href} {...props}>{item.title}</a>
                  {/snippet}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/each}
          {/if}
        </Sidebar.Menu>
      </Sidebar.Group>
    {/each}
  </Sidebar.Content>
  <Sidebar.Rail />
</Sidebar.Root>
