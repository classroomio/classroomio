<script lang="ts">
  import { page } from '$app/state';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
  import LibraryBigIcon from '@lucide/svelte/icons/library-big';
  import UsersIcon from '@lucide/svelte/icons/users';
  import Settings2 from '@lucide/svelte/icons/settings-2';
  import MessageSquareMoreIcon from '@lucide/svelte/icons/message-square-more';
  import BadgeHelpIcon from '@lucide/svelte/icons/badge-help';
  import Dice6Icon from '@lucide/svelte/icons/dice-6';
  import LayoutTemplateIcon from '@lucide/svelte/icons/layout-template';
  import OrgSelector from '$lib/components/OrgSelector/OrgSelector.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { currentOrgPath, isFreePlan } from '$lib/utils/store/org';

  import { goto } from '$app/navigation';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import { t } from '$lib/utils/functions/translations';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { sideBar } from './store';

  import * as Sidebar from '$src/base/sidebar';
  import * as DropdownMenu from '$src/base/dropdown-menu';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Menu from './ProfileMenu/Menu.svelte';

  interface MenuItems {
    label: string;
    path: string;
    show: boolean;
    isActive: boolean;
  }

  function isActive(pagePath: string, itemPath: string) {
    const pageLinkItems = pagePath.split('/');
    const itemLinkItems = itemPath.split('/');

    if (itemLinkItems.length !== pageLinkItems.length) {
      return false;
    }

    return pagePath.includes(itemPath);
  }
  const toggleSidebar = () => {
    $sideBar.hidden = !$sideBar.hidden;
  };

  const openModal = () => {
    goto(window.location.pathname + '?upgrade=true');
  };

  const menuItems: MenuItems[] = $derived.by(() => [
    {
      path: '',
      label: $t('org_navigation.dashboard'),
      isActive: isActive(page.url.pathname, `${$currentOrgPath}`),
      show: true
    },
    {
      path: '/courses',
      label: $t('org_navigation.courses'),
      isActive: page.url.pathname.includes(`${$currentOrgPath}/courses`),
      show: true
    },
    {
      path: '/community',
      label: $t('org_navigation.community'),
      isActive: page.url.pathname.includes(`${$currentOrgPath}/community`),
      show: true
    },
    {
      path: '/audience',
      label: $t('org_navigation.audience'),
      isActive: page.url.pathname.includes(`${$currentOrgPath}/audience`),
      show: true
    },
    {
      path: '/setup',
      label: $t('org_navigation.setup'),
      isActive: page.url.pathname.includes(`${$currentOrgPath}/setup`),
      show: !!$isOrgAdmin
    }
  ]);
</script>

<section class="relative flex items-start">
  <Sidebar.Root variant="floating" class="inset-y-12 block h-[calc(100vh-48px)] w-[250px] min-w-[250px]">
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <OrgSelector />
        </Sidebar.GroupContent>
      </Sidebar.Group>

      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#each menuItems as menuItem}
              {#if menuItem.show}
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton>
                    {#snippet child()}
                      <a
                        href="{$currentOrgPath}{menuItem.path}"
                        class="text-black no-underline"
                        onclick={toggleSidebar}
                      >
                        <li
                          class="group mb-1 flex items-center gap-2.5 px-2.5 py-2 {NavClasses.item} {menuItem.isActive
                            ? NavClasses.active
                            : 'dark:text-white'}"
                        >
                          {#if menuItem.path === ''}
                            <LayoutDashboardIcon size={16} class="group-hover:animate-gather" />
                          {:else if menuItem.path === '/courses'}
                            <LibraryBigIcon size={16} class="group-hover:animate-library-expand" />
                          {:else if menuItem.path === '/site'}
                            <LayoutTemplateIcon size={16} class="group-hover:animate-template-morph" />
                          {:else if menuItem.path === '/community'}
                            <MessageSquareMoreIcon size={16} class="group-hover:animate-ripple" />
                          {:else if menuItem.path === '/quiz'}
                            <Dice6Icon size={16} class="group-hover:animate-roll" />
                          {:else if menuItem.path === '/audience'}
                            <UsersIcon size={16} class="group-hover:animate-gather" />
                          {:else if menuItem.path === '/setup'}
                            <Settings2 size={16} class="group-hover:animate-setup-configure" />
                          {/if}
                          <p class="text-sm font-medium">{menuItem.label}</p>
                        </li>
                      </a>
                    {/snippet}
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
              {/if}
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>

      <span class="grow"></span>

      <Sidebar.Group>
        {#if $isFreePlan}
          <div
            class="border-primary-700 mx-4 flex flex-col items-center justify-center gap-4 rounded-md border px-2 py-6 text-center transition-all ease-in-out hover:scale-95"
          >
            <img src="/upgrade.png" alt="upgrade" class="h-16 w-16" />
            <span class="flex flex-col gap-1">
              <p class="text-base font-semibold">{$t('org_navigation.early_adopter')}</p>
              <p class="text-xs">{$t('org_navigation.unlock')}</p>
            </span>
            <PrimaryButton label={$t('org_navigation.upgrade')} onClick={openModal} className="font-normal" />
          </div>
        {/if}
      </Sidebar.Group>

      <Sidebar.Footer>
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                {#snippet child({ props })}
                  <Sidebar.MenuButton
                    {...props}
                    class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <a
                      href={$currentOrgPath}
                      class="flex h-full w-full items-center justify-start space-x-2 text-start"
                      onclick={toggleSidebar}
                    >
                      <BadgeHelpIcon size={20} />
                      <p class="text-sm font-medium dark:text-white">{$t('org_navigation.help')}</p>
                    </a></Sidebar.MenuButton
                  >

                  <Sidebar.MenuButton
                    {...props}
                    class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div class="flex w-full items-center justify-start space-x-2 text-start">
                      <Avatar
                        src={$profile.avatar_url}
                        name={$profile.username}
                        width="w-[1.2rem]"
                        height="h-[1.2rem]"
                      />
                      <p class="max-w-full truncate text-sm font-medium dark:text-white">
                        {$profile.fullname}
                      </p>
                    </div>
                    <ChevronRight class="ml-auto" />
                  </Sidebar.MenuButton>
                {/snippet}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content side="right" class="w-(--bits-dropdown-menu-anchor-width)">
                <Menu />
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Sidebar.MenuItem>
        </Sidebar.Menu>
      </Sidebar.Footer>
    </Sidebar.Content>
  </Sidebar.Root>

  <button class="mt-3 scale-110">
    <Sidebar.Trigger />
  </button>
</section>
