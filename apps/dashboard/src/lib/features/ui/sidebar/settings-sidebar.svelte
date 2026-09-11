<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import SearchIcon from '@lucide/svelte/icons/search';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { page } from '$app/state';
  import { t } from '$lib/utils/functions/translations';
  import { Input } from '@cio/ui/base/input';
  import { IS_AI_ENABLED } from '$lib/utils/constants/ai';
  import { BackButton } from '@cio/ui';
  import OrgLogo from './org-sidebar/org-logo.svelte';

  const groups = [
    {
      label: 'settings.sidebar.workspace',
      items: [
        { key: 'settings.sidebar.branding', path: '/settings/org' },
        { key: 'settings.tabs.domains_tab', path: '/settings/domains' },
        { key: 'settings.tabs.teams_tab', path: '/settings/teams' },
        { key: 'settings.tabs.billing_tab', path: '/settings/billing' },
        { key: 'settings.tabs.customize_lms_tab', path: '/settings/customize-lms' },
        { key: 'settings.tabs.landing_page_tab', path: '/settings/landingpage' }
      ]
    },
    {
      label: 'settings.sidebar.personal',
      items: [
        { key: 'settings.tabs.profile_tab', path: '/settings' },
        { key: 'settings.tabs.notifications_tab', path: '/settings/notifications' }
      ]
    },
    {
      label: 'settings.sidebar.connections',
      items: [
        ...(IS_AI_ENABLED
          ? [
              { key: 'settings.tabs.ai_tutor_tab', path: '/settings/ai-tutor' },
              { key: 'settings.tabs.ai_credits_tab', path: '/settings/ai-credits' }
            ]
          : []),
        { key: 'settings.tabs.token_auth_tab', path: '/settings/auth/token-auth' },
        { key: 'settings.tabs.auth_tab', path: '/settings/auth' }
      ]
    }
  ];

  let search = $state('');
  const currentPath = $derived($currentOrgPath);
  const visibleGroups = $derived(
    groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => t.get(item.key).toLowerCase().includes(search.toLowerCase()))
      }))
      .filter((group) => group.items.length > 0)
  );
</script>

<Sidebar.Root collapsible="offcanvas" class="border-r">
  <Sidebar.Header class="gap-3 p-3">
    <OrgLogo />
    <BackButton href={currentPath} label={t.get('navigation.goto_dashboard')} class="px-2! py-2!" />
    <div class="relative">
      <SearchIcon
        class="ui:text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        size={16}
      />
      <Input bind:value={search} placeholder={t.get('settings.sidebar.search')} class="!pl-10" />
    </div>
  </Sidebar.Header>
  <Sidebar.Content class="gap-0">
    {#each visibleGroups as group (group.label)}
      <Sidebar.Group class="px-2! py-0!">
        <Sidebar.GroupLabel>{t.get(group.label)}</Sidebar.GroupLabel>
        <Sidebar.Menu>
          {#each group.items as item (item.path)}
            {@const href = `${currentPath}${item.path}`}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={href === page.url.pathname}>
                {#snippet child({ props })}
                  <a {href} {...props}>{t.get(item.key)}</a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.Group>
    {/each}
  </Sidebar.Content>
</Sidebar.Root>
