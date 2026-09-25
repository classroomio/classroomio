<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg, currentOrgPath, orgs, isOrgAdmin } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { page } from '$app/state';
  import { resolveDynamicPluginNav } from '@cio/sdk';
  import { configuredPlugins } from '@plugins';
  import { resolvePluginIcon } from '$features/plugins/utils/plugin-icons';

  import AppLogo from './app-logo.svelte';
  import NavMain from './nav-main.svelte';
  import { orgNavCountsApi } from './org-nav-counts.svelte';
  import { SidebarFooterMenu } from '../footer';
  import UpgradeTrigger from './upgrade-trigger.svelte';
  import SidebarSkeleton from '../sidebar-skeleton.svelte';
  import { PluginPopover, orgCapabilitiesApi } from '$features/plugins';

  const isOrgLoaded = $derived($orgs.length > 0 && $profile.id);

  const pluginNavItems = $derived(
    resolveDynamicPluginNav(configuredPlugins, $currentOrg.siteName ?? '', orgCapabilitiesApi.enabledCapabilityIds)
  );

  const toolsNavItems = $derived(pluginNavItems.filter((item) => item.group === 'tools'));

  $effect(() => {
    if (!isOrgLoaded || !$currentOrg.id) return;
    void orgNavCountsApi.ensureCounts($currentOrg.id);
  });
</script>

{#if !isOrgLoaded}
  <SidebarSkeleton />
{:else}
  <Sidebar.Root collapsible="icon">
    <Sidebar.Header>
      <AppLogo />
    </Sidebar.Header>

    <Sidebar.Content class="gap-0!">
      <NavMain>
        {#snippet toolsItems()}
          {#if $isOrgAdmin}
            {#each toolsNavItems as navItem (navItem.pluginId)}
              {@const NavIcon = resolvePluginIcon(navItem.icon)}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  tooltipContent={$t(navItem.titleKey)}
                  isActive={page.url.pathname.startsWith(navItem.href)}
                  data-testid="org-nav-plugin-{navItem.pluginId}"
                >
                  {#snippet child({ props })}
                    <a href={navItem.href} {...props}>
                      <div class="flex items-center gap-2">
                        <NavIcon size={16} />
                        <span>{$t(navItem.titleKey)}</span>
                      </div>
                    </a>
                  {/snippet}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/each}
            <Sidebar.MenuItem>
              <PluginPopover />
            </Sidebar.MenuItem>
          {/if}
        {/snippet}
      </NavMain>
    </Sidebar.Content>

    <Sidebar.Footer class="gap-4!">
      <UpgradeTrigger />
      <SidebarFooterMenu />
    </Sidebar.Footer>

    <Sidebar.Rail />
  </Sidebar.Root>
{/if}
