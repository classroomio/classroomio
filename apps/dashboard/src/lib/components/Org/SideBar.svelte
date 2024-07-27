<script lang="ts">
  import { page } from '$app/stores';
  import HelpIcon from 'carbon-icons-svelte/lib/Help.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import OrgSelector from '$lib/components/OrgSelector/OrgSelector.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import { currentOrgPath, isFreePlan } from '$lib/utils/store/org';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import { sideBar } from './store';
  import { t } from '$lib/utils/functions/translations';
  import { goto } from '$app/navigation';
  import SideBarExpandeable from '$lib/components/Org/SidebarExpandeable.svelte';

  interface menuItems {
    id: string;
    label: string;
    to: string | string[];
    isDropdown?: boolean;
    isExpanded?: boolean;
    show: boolean;
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
      show: true
    },
    {
      id: 'courses',
      to: ['/courses', '/pathways'],
      isDropdown: true,
      isExpanded: true,
      label: $t('org_navigation.courses'),
      show: true
    },
    {
      id: 'community',
      to: '/community',
      label: $t('org_navigation.community'),
      show: true
    },
    {
      id: 'audience',
      to: '/audience',
      label: $t('org_navigation.audience'),
      show: true
    },
    {
      id: 'setup',
      to: '/setup',
      label: $t('org_navigation.setup'),
      show: $isOrgAdmin
    }
  ];
</script>

<aside
  class={`${
    $sideBar.hidden
      ? 'absolute z-40 -translate-x-[100%] md:relative md:translate-x-0'
      : 'absolute z-40 translate-x-0 md:relative'
  } border-r-1 h-[calc(100vh-48px)] w-[250px] min-w-[250px] overflow-y-auto border border-b-0 border-l-0 border-t-0 border-gray-100 dark:border-neutral-600 bg-gray-100 transition dark:bg-neutral-900`}
>
  <div class="flex h-full flex-col">
    <div class="">
      <OrgSelector />

      <ul class="mt-4 my-2 px-4">
        {#each menuItems as menuItem}
          {#if menuItem.show}
            <SideBarExpandeable
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
                    {:else if subPath === '/pathways'}
                      {$t('org_navigation.pathway')}
                    {/if}
                  </a>
                {/each}
              {/if}
            </SideBarExpandeable>
          {/if}
        {/each}
      </ul>
    </div>
    <span class="flex-grow" />

    {#if $isFreePlan}
      <div
        class="border-primary-700 mx-4 flex flex-col items-center justify-center gap-4 rounded-md border px-2 py-6 text-center hover:scale-95 transition-all ease-in-out"
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
          <p class="ml-2.5 dark:text-white text-sm font-medium">{$t('org_navigation.help')}</p>
        </li>
      </a>
      <a href="{$currentOrgPath}/settings" class="text-black no-underline" on:click={toggleSidebar}>
        <li
          class="mb-2 flex items-center px-2.5 py-1.5 {NavClasses.item} {isActive(
            $page.url.pathname,
            `${$currentOrgPath}/settings`
          )
            ? NavClasses.active
            : 'dark:text-white'}"
        >
          <Avatar
            src={$profile.avatar_url}
            name={$profile.username}
            width="w-[1.2rem]"
            height="h-[1.2rem]"
          />
          <p class="ml-2.5 text-sm font-medium">{$t('org_navigation.settings')}</p>
        </li>
      </a>
    </ul>
  </div>
</aside>
