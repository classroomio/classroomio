<script>
  import { page } from '$app/stores';
  import HelpIcon from 'carbon-icons-svelte/lib/Help.svelte';

  import TextChip from '$lib/components/Chip/Text.svelte';
  import OrgSelector from '$lib/components/OrgSelector/OrgSelector.svelte';
  import HomeIcon from '$lib/components/Icons/HomeIcon.svelte';
  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';
  import ExerciseIcon from '$lib/components/Icons/ExerciseIcon.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';

  let activeClass = 'bg-gray-200 dark:bg-gray-800';

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
      {#if $currentOrg.avatar_url}
        <Avatar
          src={$currentOrg.avatar_url}
          name={$currentOrg.name}
          shape="rounded-md"
          width="w-7"
          height="h-7"
        />
      {:else}
        <TextChip value={$currentOrg.shortName} className="bg-blue-200 font-bold" />
      {/if}

      <OrgSelector />

      <ul class="my-5">
        <a href="/lms" class="text-black">
          <li
            class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 {isActive(
              $page.url.pathname,
              `/lms`
            ) && activeClass}"
          >
            <HomeIcon />
            <p class="dark:text-white ml-2">Home</p>
          </li>
        </a>
        <a href="/lms/mylearning" class="text-black">
          <li
            class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 {isActive(
              $page.url.pathname,
              `/lms/mylearning`
            ) && activeClass}"
          >
            <CourseIcon />
            <p class="dark:text-white ml-2">My Learning</p>
          </li>
        </a>
        <a href="/lms/exercises" class="text-black">
          <li
            class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 {isActive(
              $page.url.pathname,
              `/lms/exercises`
            ) && activeClass}"
          >
            <ExerciseIcon />
            <p class="dark:text-white ml-2">Exercises</p>
          </li>
        </a>
      </ul>
    </div>
    <span class="flex-grow" />
    <ul class="my-5 pb-5 px-4">
      <a href="/lms" class="text-black">
        <li
          class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          <HelpIcon size={20} class="carbon-icon dark:text-white" />
          <p class="dark:text-white ml-2">Help</p>
        </li>
      </a>
      <a href="/lms/settings" class="text-black">
        <li
          class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 {isActive(
            $page.url.pathname,
            `/lms/settings`
          ) && activeClass}"
        >
          <Avatar src={$profile.avatar_url} name={$profile.username} width="w-7" height="h-7" />
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
