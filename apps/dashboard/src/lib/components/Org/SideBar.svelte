<script lang="ts">
  import { page } from '$app/stores';
  import HelpIcon from 'carbon-icons-svelte/lib/Help.svelte';
  import ForumIcon from 'carbon-icons-svelte/lib/Forum.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import OrgSelector from '$lib/components/OrgSelector/OrgSelector.svelte';
  import HomeIcon from '$lib/components/Icons/HomeIcon.svelte';
  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';
  import QuizIcon from '$lib/components/Icons/QuizIcon.svelte';
  import SiteSettingsIcon from '$lib/components/Icons/SiteSettingsIcon.svelte';
  import AudienceIcon from '$lib/components/Icons/AudienceIcon.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import { sideBar } from './store';
  import { isUpgradeModalOpen } from './UpgradePlan/store';
  import UpgradePlanModal from './UpgradePlan/UpgradePlanModal.svelte';

  const menuItems = [
    {
      path: '',
      label: 'Dashboard'
    },
    // {
    //   path: '/quiz',
    //   label: 'Quizzes'
    // },
    {
      path: '/courses',
      label: 'Courses'
    },
    {
      path: '/community',
      label: 'Community'
    },
    // {
    //   path: '/site',
    //   label: 'Site settings',
    // },
    {
      path: '/audience',
      label: 'Audience'
    }
  ];

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
    $isUpgradeModalOpen = true;
  };
</script>

<UpgradePlanModal />
<aside
  class={`${
    $sideBar.hidden
      ? 'absolute z-40 -translate-x-[100%] md:relative md:translate-x-0'
      : 'absolute z-40 translate-x-0 md:relative'
  } border-r-1 h-[calc(100vh-48px)] w-[250px] min-w-[250px] overflow-y-auto border border-b-0 border-l-0 border-t-0 bg-gray-100 transition dark:bg-neutral-900`}
>
  <div class="flex h-full flex-col">
    <div class=" px-4 pt-5">
      {#if $currentOrg.avatar_url && $currentOrg.name}
        <Avatar
          src={$currentOrg.avatar_url}
          name={$currentOrg.name}
          shape="rounded-md"
          width="w-7"
          height="h-7"
        />
      {:else if $currentOrg.shortName}
        <TextChip
          value={$currentOrg.shortName}
          className="bg-primary-200 dark:text-black font-bold"
        />
      {/if}

      <OrgSelector />

      <ul class="my-5">
        {#each menuItems as menuItem}
          <a
            href="{$currentOrgPath}{menuItem.path}"
            class="text-black no-underline"
            on:click={toggleSidebar}
          >
            <li
              class="mb-2 flex items-center px-4 py-3 {NavClasses.item} {isActive(
                $page.url.pathname,
                `${$currentOrgPath}${menuItem.path}`
              )
                ? NavClasses.active
                : 'dark:text-white'}"
            >
              {#if menuItem.path === ''}
                <HomeIcon />
              {:else if menuItem.path === '/courses'}
                <CourseIcon />
              {:else if menuItem.path === '/site'}
                <SiteSettingsIcon />
              {:else if menuItem.path === '/community'}
                <ForumIcon size={24} class="carbon-icon fill-[#000] dark:fill-[#fff]" />
              {:else if menuItem.path === '/quiz'}
                <QuizIcon />
              {:else if menuItem.path === '/audience'}
                <AudienceIcon />
              {/if}
              <p class=" ml-2">{menuItem.label}</p>
            </li>
          </a>
        {/each}
      </ul>
    </div>

    <div
      class="border-primary-400 mx-4 flex flex-col items-center justify-center gap-4 rounded-md border px-2 py-6 text-center"
    >
      <img src="/upgrade.png" alt="upgrade" class="h-16 w-16" />
      <span class="flex flex-col gap-1">
        <p class="text-base font-semibold">Unlock pro features</p>
        <p class="text-xs">Enjoy unlimited features better customization with pro</p>
      </span>
      <PrimaryButton label="Upgrade Now" onClick={openModal} className="font-normal" />
    </div>

    <span class="flex-grow" />
    <ul class="my-5 px-4 pb-5">
      <a href={$currentOrgPath} class="text-black no-underline" on:click={toggleSidebar}>
        <li class="mb-2 flex items-center rounded px-4 py-3">
          <HelpIcon size={20} class="carbon-icon dark:text-white" />
          <p class="ml-2 dark:text-white">Help</p>
        </li>
      </a>
      <a href="{$currentOrgPath}/settings" class="text-black no-underline" on:click={toggleSidebar}>
        <li
          class="mb-2 flex items-center px-4 py-3 {NavClasses.item} {isActive(
            $page.url.pathname,
            `${$currentOrgPath}/settings`
          )
            ? NavClasses.active
            : 'dark:text-white'}"
        >
          <Avatar src={$profile.avatar_url} name={$profile.username} width="w-7" height="h-7" />
          <p class="ml-2">Settings</p>
        </li>
      </a>
    </ul>
  </div>
</aside>
