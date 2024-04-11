<script lang="ts">
  import { page } from '$app/stores';
  import HelpIcon from 'carbon-icons-svelte/lib/Help.svelte';
  import ForumIcon from 'carbon-icons-svelte/lib/Forum.svelte';
  import { SettingsAdjust } from 'carbon-icons-svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import OrgSelector from '$lib/components/OrgSelector/OrgSelector.svelte';
  import HomeIcon from '$lib/components/Icons/HomeIcon.svelte';
  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';
  import QuizIcon from '$lib/components/Icons/QuizIcon.svelte';
  import SiteSettingsIcon from '$lib/components/Icons/SiteSettingsIcon.svelte';
  import AudienceIcon from '$lib/components/Icons/AudienceIcon.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import { currentOrgPath, currentOrgPlan, isFreePlan } from '$lib/utils/store/org';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import { sideBar } from './store';
  import { t } from '$lib/utils/functions/translations';

  interface menuItems {
    label: string;
    path: string;
  }

  let menuItems: menuItems[] = [];

  $: menuItems = [
    {
      path: '',
      label: $t('org_navigation.dashboard')
    },
    {
      path: '/courses',
      label: $t('org_navigation.courses')
    },
    {
      path: '/community',
      label: $t('org_navigation.community')
    },
    {
      path: '/audience',
      label: $t('org_navigation.audience')
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
    goto(window.location.pathname + '?upgrade=true');
  };

  $: {
    menuItems = [
      {
        path: '',
        label: 'Dashboard',
        show: true
      },
      // {
      //   path: '/quiz',
      //   label: 'Quizzes'
      // },
      {
        path: '/courses',
        label: 'Courses',
        show: true
      },
      {
        path: '/community',
        label: 'Community',
        show: true
      },
      // {
      //   path: '/site',
      //   label: 'Site settings',
      // },
      {
        path: '/audience',
        label: 'Audience',
        show: true
      },
      {
        path: '/setup',
        label: 'Setup',
        show: $isOrgAdmin
      }
    ];
  }
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
            <a
              href="{$currentOrgPath}{menuItem.path}"
              class="text-black no-underline"
              on:click={toggleSidebar}
            >
              <li
                class="mb-1 flex items-center gap-2.5 px-2.5 py-2 {NavClasses.item} {isActive(
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
                  <ForumIcon size={20} class="carbon-icon fill-[#000] dark:fill-[#fff]" />
                {:else if menuItem.path === '/quiz'}
                  <QuizIcon />
                {:else if menuItem.path === '/audience'}
                  <AudienceIcon />
                {:else if menuItem.path === '/setup'}
                  <SettingsAdjust />
                {/if}
                <p class="text-sm font-medium">{menuItem.label}</p>
              </li>
            </a>
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
          <p class="text-base font-semibold">Become an Early Adopter</p>
          <p class="text-xs">Unlock unlimited features and invest in our future</p>
        </span>
        <PrimaryButton label="Upgrade Now" onClick={openModal} className="font-normal" />
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
