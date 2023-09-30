<script lang="ts">
  import { page } from '$app/stores';
  import HelpIcon from 'carbon-icons-svelte/lib/Help.svelte';
  import ForumIcon from 'carbon-icons-svelte/lib/Forum.svelte';

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
  import { menu } from './store';

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
    $menu.hidden = !$menu.hidden;
  };
</script>

<aside
  class={`${
    $menu.hidden
      ? '-translate-x-[100%] absolute md:translate-x-0 md:relative z-40'
      : 'translate-x-0 absolute md:relative z-40'
  } overflow-y-auto transition w-[250px] min-w-[250px] bg-gray-100 dark:bg-neutral-900 h-[calc(100vh-48px)] border border-l-0 border-t-0 border-b-0 border-r-1`}
>
  <div class="h-full flex flex-col">
    <div class="border-b border-gray-200 pt-5 px-4">
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
              class="flex items-center py-3 px-4 mb-2 {NavClasses.item} {isActive(
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
                <ForumIcon size={24} class="carbon-icon dark:fill-[#fff] fill-[#000]" />
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
    <span class="flex-grow" />
    <ul class="my-5 pb-5 px-4">
      <a href={$currentOrgPath} class="text-black no-underline" on:click={toggleSidebar}>
        <li class="flex items-center py-3 px-4 mb-2 rounded">
          <HelpIcon size={20} class="carbon-icon dark:text-white" />
          <p class="dark:text-white ml-2">Help</p>
        </li>
      </a>
      <a href="{$currentOrgPath}/settings" class="text-black no-underline" on:click={toggleSidebar}>
        <li
          class="flex items-center py-3 px-4 mb-2 {NavClasses.item} {isActive(
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
