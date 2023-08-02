<script>
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

  let activeClass = 'bg-gray-200 dark:bg-gray-700';

  const menuItems = [
    {
      path: '',
      label: 'Home',
    },
    {
      path: '/quiz',
      label: 'Quizzes',
    },
    {
      path: '/courses',
      label: 'Courses',
    },
    {
      path: '/community',
      label: 'Community',
    },
    // {
    //   path: '/site',
    //   label: 'Site settings',
    // },
    {
      path: '/audience',
      label: 'Audience',
    },
  ];

  function isActive(pagePath, itemPath) {
    const pageLinkItems = pagePath.split('/');
    const itemLinkItems = itemPath.split('/');

    if (itemLinkItems.length !== pageLinkItems.length) {
      return false;
    }

    return pagePath.includes(itemPath);
  }
</script>

<aside class="root bg-gray-100 dark:bg-gray-700 h-full">
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
          className="bg-blue-200 font-bold"
        />
      {/if}

      <OrgSelector />

      <ul class="my-5">
        {#each menuItems as menuItem}
          <a
            href="{$currentOrgPath}{menuItem.path}"
            class="text-black no-underline"
          >
            <li
              class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 dark:hover:bg-gray-500 {isActive(
                $page.url.pathname,
                `${$currentOrgPath}${menuItem.path}`
              ) && activeClass}"
            >
              {#if menuItem.path === ''}
                <HomeIcon />
              {:else if menuItem.path === '/courses'}
                <CourseIcon />
              {:else if menuItem.path === '/site'}
                <SiteSettingsIcon />
              {:else if menuItem.path === '/community'}
                <ForumIcon size={20} class="carbon-icon" />
              {:else if menuItem.path === '/quiz'}
                <QuizIcon />
              {:else if menuItem.path === '/audience'}
                <AudienceIcon />
              {/if}
              <p class="dark:text-white ml-2">{menuItem.label}</p>
            </li>
          </a>
        {/each}
      </ul>
    </div>
    <span class="flex-grow" />
    <ul class="my-5 pb-5 px-4">
      <a href={$currentOrgPath} class="text-black no-underline">
        <li
          class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 dark:hover:bg-gray-500"
        >
          <HelpIcon size={20} class="carbon-icon" />
          <p class="dark:text-white ml-2">Help</p>
        </li>
      </a>
      <a href="{$currentOrgPath}/settings" class="text-black no-underline">
        <li
          class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 dark:hover:bg-gray-500 {isActive(
            $page.url.pathname,
            `${$currentOrgPath}/settings`
          ) && activeClass}"
        >
          <Avatar
            src={$profile.avatar_url}
            name={$profile.username}
            width="w-7"
            height="h-7"
          />
          <p class="dark:text-white ml-2">Settings</p>
        </li>
      </a>
    </ul>
  </div>
</aside>

<style>
  .root {
    width: 250px;
  }
</style>
