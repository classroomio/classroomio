<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { t } from '$lib/utils/functions/translations';
  import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
  import LibraryBigIcon from '@lucide/svelte/icons/library-big';
  import MessageSquareMoreIcon from '@lucide/svelte/icons/message-square-more';
  import UsersIcon from '@lucide/svelte/icons/users';
  import Settings2Icon from '@lucide/svelte/icons/settings-2';
  import { isActive } from '$lib/utils/functions/app';
  import { page } from '$app/state';
  import { profile } from '$lib/utils/store/user';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { currentOrg, orgs } from '$lib/utils/store/org';

  import OrgSwitcher from './org-switcher.svelte';
  import NavMain from './nav-main.svelte';
  import { SidebarFooterMenu } from '../footer';
  import UpgradeTrigger from './upgrade-trigger.svelte';
  import SidebarSkeleton from '../sidebar-skeleton.svelte';

  const data = $derived({
    navMain: [
      {
        title: $t('org_navigation.dashboard'),
        url: '/',
        icon: LayoutDashboardIcon,
        isActive: isActive(page.url.pathname, `/org/${$currentOrg.siteName}`)
      },
      {
        title: $t('org_navigation.courses'),
        url: `/courses`,
        icon: LibraryBigIcon,
        isActive: isActive(page.url.pathname, `/org/${$currentOrg.siteName}/courses`)
      },
      {
        title: $t('org_navigation.community'),
        url: `/community`,
        icon: MessageSquareMoreIcon,
        isActive: isActive(page.url.pathname, `/org/${$currentOrg.siteName}/community`)
      },
      {
        title: $t('org_navigation.audience'),
        url: `/audience`,
        icon: UsersIcon,
        isActive: isActive(page.url.pathname, `/org/${$currentOrg.siteName}/audience`)
      },
      ...(!!$isOrgAdmin
        ? [
            {
              title: $t('org_navigation.setup'),
              url: `/setup`,
              icon: Settings2Icon,
              isActive: isActive(page.url.pathname, `/org/${$currentOrg.siteName}/setup`)
            }
          ]
        : [])
    ],
    user: {
      name: $profile.fullname,
      email: $profile.email || '',
      avatar: $profile.avatarUrl || ''
    }
  });

  const isOrgLoaded = $derived($orgs.length > 0 && $profile.fullname && $profile.email);
</script>

{#if !isOrgLoaded}
  <SidebarSkeleton />
{:else}
  <Sidebar.Provider class="ui:flex ui:w-fit ui:items-start ui:gap-4">
    <Sidebar.Root collapsible="icon" class="ui:inset-y-12 h-[calc(100vh-48px)]">
      <Sidebar.Header>
        <OrgSwitcher />
      </Sidebar.Header>

      <Sidebar.Content>
        <NavMain items={data.navMain} />
      </Sidebar.Content>

      <UpgradeTrigger />

      {#if data.user}
        <Sidebar.Footer>
          <SidebarFooterMenu />
        </Sidebar.Footer>
      {/if}

      <Sidebar.Rail />
    </Sidebar.Root>

    <Sidebar.Inset class="">
      <Sidebar.Trigger class="-ml-1" />
    </Sidebar.Inset>
  </Sidebar.Provider>
{/if}
