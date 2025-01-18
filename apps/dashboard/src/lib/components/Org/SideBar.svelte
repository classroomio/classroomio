<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import SidebarExpandeable from '$lib/components/Org/SidebarExpandeable.svelte';
  import OrgSelector from '$lib/components/OrgSelector/OrgSelector.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { currentOrgPath, isFreePlan } from '$lib/utils/store/org';
  import { ChevronRight } from 'carbon-icons-svelte';
  import HelpIcon from 'carbon-icons-svelte/lib/Help.svelte';

  import ProfileMenu from '$lib/components/Org/ProfileMenu/index.svelte';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import { t } from '$lib/utils/functions/translations';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { sideBar } from './store';

  import { profileMenu } from './store';

  interface menuItems {
    id: string;
    label: string;
    to: string | string[];
    isDropdown?: boolean;
    isExpanded?: boolean;
    show: boolean;
    isActive: boolean;
  }

  let menuItems: menuItems[] = [];

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

  $: menuItems = [
    {
      id: 'dashboard',
      to: '',
      label: $t('org_navigation.dashboard'),
      isActive: isActive($page.url.pathname, `${$currentOrgPath}`),
      show: true
    },
    {
      id: 'courses',
      to: ['/courses', '/tags', '/pathways'],
      isDropdown: true,
      isExpanded: true,
      label: $t('org_navigation.courses'),
      isActive: $page.url.pathname.includes(`${$currentOrgPath}/courses`),
      show: true
    },
    {
      id: 'community',
      to: '/community',
      label: $t('org_navigation.community'),
      isActive: $page.url.pathname.includes(`${$currentOrgPath}/community`),
      show: true
    },
    {
      id: 'audience',
      to: '/audience',
      label: $t('org_navigation.audience'),
      isActive: $page.url.pathname.includes(`${$currentOrgPath}/audience`),
      show: true
    },
    {
      path: '/setup',
      id: 'setup',
      to: '/setup',
      label: $t('org_navigation.setup'),
      isActive: $page.url.pathname.includes(`${$currentOrgPath}/setup`),
      show: $isOrgAdmin
    }
  ];
</script>

<div bind:this={$profileMenu.ref} class="static md:relative">
  <aside
    class={`${
      $sideBar.hidden
        ? 'absolute top-[48px] z-40 -translate-x-[100%] md:relative md:top-0 md:translate-x-0'
        : 'absolute top-[48px] z-40 translate-x-0 md:relative md:top-0'
    } border-r-1 h-[calc(100vh-48px)] w-[250px] min-w-[250px] overflow-y-auto border border-b-0 border-l-0 border-t-0 border-gray-100 bg-gray-100 transition dark:border-neutral-600 dark:bg-neutral-900`}
  >
    <div class="flex h-full flex-col">
      <div class="">
        <OrgSelector />

        <ul class="my-2 mt-4 px-4">
          {#each menuItems as menuItem}
            {#if menuItem.show}
              <SidebarExpandeable
                id={menuItem.id}
                label={menuItem.label}
                href={typeof menuItem.to === 'string' ? `${$currentOrgPath}${menuItem.to}` : null}
                handleClick={toggleSidebar}
                isGroupActive={typeof menuItem.to === 'string' &&
                  isActive($page.url.pathname, `${$currentOrgPath}${menuItem.to}`)}
                isExpanded={menuItem.isExpanded}
                isDropdown={menuItem.isDropdown}
              >
                {#if Array.isArray(menuItem.to)}
                  {#each menuItem.to as subPath}
                    <a
                      href="{$currentOrgPath}{subPath}"
                      class="{NavClasses.item}  {$page.url.pathname.includes(subPath) &&
                        NavClasses.active} w-full py-2 pl-10 pr-2"
                      on:click={toggleSidebar}
                    >
                      {#if subPath === '/courses'}
                        {$t('org_navigation.all_courses')}
                      {:else if subPath === '/tags'}
                        {$t('org_navigation.tags')}
                      {:else if subPath === '/pathways'}
                        {$t('org_navigation.pathway')}
                      {/if}
                    </a>
                  {/each}
                {/if}
              </SidebarExpandeable>
            {/if}
          {/each}
        </ul>
      </div>
      <span class="flex-grow" />

      {#if $isFreePlan}
        <div
          class="border-primary-700 mx-4 flex flex-col items-center justify-center gap-4 rounded-md border px-2 py-6 text-center transition-all ease-in-out hover:scale-95"
        >
          <img src="/upgrade.png" alt="upgrade" class="h-16 w-16" />
          <span class="flex flex-col gap-1">
            <p class="text-base font-semibold">{$t('org_navigation.early_adopter')}</p>
            <p class="text-xs">{$t('org_navigation.unlock')}</p>
          </span>
          <PrimaryButton
            label={$t('org_navigation.upgrade')}
            onClick={openModal}
            className="font-normal"
          />
        </div>
      {/if}

      <ul class="my-5 px-4 pb-5">
        <a href={$currentOrgPath} class="text-black no-underline" on:click={toggleSidebar}>
          <li class="mb-2 flex items-center rounded px-2.5 py-1.5">
            <HelpIcon size={20} class="carbon-icon dark:text-white" />
            <p class="ml-2.5 text-sm font-medium dark:text-white">{$t('org_navigation.help')}</p>
          </li>
        </a>

        <button
          class="w-full"
          on:click={() => {
            $profileMenu.open = !$profileMenu.open;
            $sideBar.hidden = true;
          }}
        >
          <div
            class="mb-2 flex cursor-pointer items-center justify-between gap-2.5 px-2.5 py-2 text-black no-underline {NavClasses.item} {$page.url.pathname.includes(
              'settings'
            )
              ? NavClasses.active
              : 'dark:text-white'}"
          >
            <div class="flex w-full items-center justify-start space-x-1 text-start">
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
            <div>
              <ChevronRight />
            </div>
          </div>
        </button>
      </ul>
    </div>
  </aside>

  <ProfileMenu />
</div>
