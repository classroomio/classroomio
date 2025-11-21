<script lang="ts">
  import { page } from '$app/state';
  import type { Component } from 'svelte';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import UsersIcon from '@lucide/svelte/icons/users';
  import MapPlusIcon from '@lucide/svelte/icons/map-plus';
  import ListTodoIcon from '@lucide/svelte/icons/list-todo';
  import LibraryBigIcon from '@lucide/svelte/icons/library-big';
  import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';

  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { sideBar } from '$lib/components/Org/store';
  import { t } from '$lib/utils/functions/translations';

  import NavUser from '../Sidebar/components/nav-user.svelte';

  interface SideLinks {
    name: string;
    icon: Component;
    link: string;
    show?: () => boolean;
  }

  const user = $derived.by(() => ({
    name: $profile.fullname,
    email: $profile.email,
    avatar: $profile.avatar_url
  }));

  function isActive(pagePath: string, itemPath: string) {
    const pageLinkItems = pagePath.split('/');
    const itemLinkItems = itemPath.split('/');

    if (itemLinkItems.length !== pageLinkItems.length) {
      return false;
    }

    return pagePath.includes(itemPath);
  }

  const sideLinks: SideLinks[] = $derived.by(() =>
    [
      {
        name: $t('lms_navigation.home'),
        icon: LayoutDashboardIcon,
        link: '/lms'
      },
      {
        name: $t('lms_navigation.my_learning'),
        icon: LibraryBigIcon,
        link: '/lms/mylearning'
      },
      {
        name: $t('lms_navigation.exercise'),
        icon: ListTodoIcon,
        link: '/lms/exercises',
        show() {
          return $currentOrg?.customization?.dashboard?.exercise;
        }
      },
      {
        name: $t('lms_navigation.community'),
        icon: UsersIcon,
        link: '/lms/community',
        show() {
          return $currentOrg?.customization?.dashboard?.community;
        }
      },
      {
        name: $t('lms_navigation.explore'),
        icon: MapPlusIcon,
        link: '/lms/explore'
      }
    ].filter((link) => (link.show ? link.show() : true))
  );

  const toggleSidebar = () => {
    $sideBar.hidden = !$sideBar.hidden;
  };
</script>

<Sidebar.Provider class="w-fit">
  <Sidebar.Root collapsible="icon" class="inset-y-12 h-[calc(100vh-48px)] {$sideBar.hidden ? 'hidden' : ''}">
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>LMS Navigation</Sidebar.GroupLabel>
        <Sidebar.Menu>
          {#each sideLinks as item (item.link)}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton tooltipContent={item.name}>
                <a
                  href={item.link}
                  onclick={toggleSidebar}
                  class="flex w-full items-center gap-4 {isActive(page.url.pathname, item.link)
                    ? 'bg-accent text-accent-foreground rounded-md px-3 py-2'
                    : ''}"
                >
                  <item.icon size={16} />
                  {item.name}
                </a>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>

    {#if user}
      <Sidebar.Footer>
        <NavUser {user} />
      </Sidebar.Footer>
    {/if}

    <Sidebar.Rail />
  </Sidebar.Root>

  <!-- TODO: FIGURE OUT WHY THIS APPEARANCE IS BUGGY  -->
  <!-- TODO: THE SIDEBAR COLLAPSE VIEW IS BAD -->
  <!-- <Sidebar.Inset>
    <Sidebar.Trigger class="-ml-1" />
  </Sidebar.Inset> -->
</Sidebar.Provider>
