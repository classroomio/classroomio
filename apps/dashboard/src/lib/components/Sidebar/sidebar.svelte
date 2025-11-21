<script lang="ts">
  import AppSidebar from './components/app-sidebar.svelte';
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
  import SidebarSkeleton from './components/sidebar-skeleton.svelte';

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

  const isReady = $derived($orgs.length > 0 && $profile.fullname && $profile.email);
</script>

{#if !isReady}
  <SidebarSkeleton />
{:else}
  <Sidebar.Provider class="flex w-fit items-start gap-4">
    <AppSidebar {data} />

    <Sidebar.Inset class="hidden md:block">
      <Sidebar.Trigger class="-ml-1" />
    </Sidebar.Inset>
  </Sidebar.Provider>
{/if}
