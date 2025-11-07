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

  import Avatar from '$lib/components/Avatar/index.svelte';
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
    <Sidebar.Header class="border-b border-gray-200 dark:border-neutral-600">
      <div class="flex w-full flex-col items-center p-4">
        <Avatar src={$profile.avatar_url} name={$profile.fullname} shape="rounded-full" width="w-20" height="h-20" />
        <div class="mt-5 flex w-full justify-center">
          <p class="max-w-[80%] truncate whitespace-nowrap text-center text-lg dark:text-white">
            {$profile.fullname}
          </p>
        </div>
      </div>
    </Sidebar.Header>

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
