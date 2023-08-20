<script>
  import { page } from '$app/stores';
  import HelpIcon from 'carbon-icons-svelte/lib/Help.svelte';
  import LicenseDraft from 'carbon-icons-svelte/lib/LicenseDraft.svelte';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import OrgSelector from '$lib/components/OrgSelector/OrgSelector.svelte';
  import HomeIcon from '$lib/components/Icons/HomeIcon.svelte';
  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';
  import CommunityIcon from '$lib/components/Icons/CommunityIcon.svelte';
  import ExerciseIcon from '$lib/components/Icons/ExerciseIcon.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { NavClasses } from '$lib/utils/constants/reusableClass';

  function isActive(pagePath, itemPath) {
    const pageLinkItems = pagePath.split('/');
    const itemLinkItems = itemPath.split('/');

    if (itemLinkItems.length !== pageLinkItems.length) {
      return false;
    }

    return pagePath.includes(itemPath);
  }
  let sideLinks = [
    {
      name: 'Home',
      icon: HomeIcon,
      link: '/lms'
    },
    {
      name: 'My Learning',
      icon: CourseIcon,
      link: '/lms/mylearning'
    },
    {
      name: 'Exercise',
      icon: LicenseDraft,
      link: '/lms/exercises'
    },
    {
      name: 'Community',
      icon: CommunityIcon,
      link: '/lms/community'
    }
  ];
</script>

<aside class="w-[250px] min-w-[250px] bg-gray-100 dark:bg-gray-700 h-full">
  <div class="h-full flex flex-col">
    <div class="border-b border-gray-200 pt-5 px-4">
      {#if $currentOrg.avatar_url}
        <Avatar
          src={$currentOrg.avatar_url}
          name={$currentOrg.name}
          shape="rounded-md"
          width="w-7"
          height="h-7"
        />
      {:else}
        <TextChip value={$currentOrg.shortName} className="bg-primary-200 font-bold" />
      {/if}

      <OrgSelector />

      <ul class="my-5">
        {#each sideLinks as item (item.name)}
          <a href={item.link} class="text-black">
            <li
              class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 dark:hover:bg-gray-500 {isActive(
                $page.url.pathname,
                `${item.link}`
              ) && NavClasses.active}"
            >
              <svelte:component
                this={item.icon}
                color={isActive($page.url.pathname, `${item.link}`) ? 'black' : 'gray'}
                size={24}
                class="carbon-icon text-white"
              />
              <p class="dark:text-white ml-2">{item.name}</p>
            </li>
          </a>
        {/each}
      </ul>
    </div>
    <span class="flex-grow" />
    <ul class="my-5 pb-5 px-4">
      <a href="/lms" class="text-black">
        <li class="flex items-center py-3 px-4 mb-2 rounded">
          <HelpIcon size={20} class="carbon-icon dark:text-white" />
          <p class="dark:text-white ml-2">Help</p>
        </li>
      </a>
      <a href="/lms/settings" class="text-black">
        <li
          class="flex items-center py-3 px-4 mb-2 rounded {isActive(
            $page.url.pathname,
            `/lms/settings`
          ) && NavClasses.active}"
        >
          <Avatar src={$profile.avatar_url} name={$profile.username} width="w-7" height="h-7" />
          <p class="dark:text-white ml-2">Settings</p>
        </li>
      </a>
    </ul>
  </div>
</aside>
