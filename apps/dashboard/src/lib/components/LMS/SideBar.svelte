<script lang="ts">
  import { page } from '$app/stores';
  import HelpIcon from 'carbon-icons-svelte/lib/Help.svelte';
  import LicenseDraft from 'carbon-icons-svelte/lib/LicenseDraft.svelte';
  import Settings from 'carbon-icons-svelte/lib/Settings.svelte';
  import HomeIcon from '$lib/components/Icons/HomeIcon.svelte';
  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';
  import CommunityIcon from '$lib/components/Icons/CommunityIcon.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import { profile } from '$lib/utils/store/user';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import { sideBar } from '$lib/components/Org/store';
  import { t } from '$lib/utils/functions/translations';

  interface sideLinks {
    name: string;
    icon: any;
    link: string;
  }

  function isActive(pagePath: string, itemPath: string) {
    const pageLinkItems = pagePath.split('/');
    const itemLinkItems = itemPath.split('/');

    if (itemLinkItems.length !== pageLinkItems.length) {
      return false;
    }

    return pagePath.includes(itemPath);
  }

  let sideLinks: sideLinks[] = [];

  $: sideLinks = [
    {
      name: $t('lms_navigation.home'),
      icon: HomeIcon,
      link: '/lms'
    },
    {
      name: $t('lms_navigation.my_learning'),
      icon: CourseIcon,
      link: '/lms/mylearning'
    },
    {
      name: $t('lms_navigation.exercise'),
      icon: LicenseDraft,
      link: '/lms/exercises'
    },
    {
      name: $t('lms_navigation.community'),
      icon: CommunityIcon,
      link: '/lms/community'
    }
  ];
  const toggleSidebar = () => {
    $sideBar.hidden = !$sideBar.hidden;
  };
</script>

<aside
  class={`${
    $sideBar.hidden
      ? '-translate-x-[100%] absolute md:translate-x-0 md:relative z-40'
      : 'translate-x-0 absolute md:relative z-40'
  } overflow-y-auto transition w-[250px] min-w-[250px] bg-gray-100 dark:bg-neutral-900 h-[calc(100vh-48px)]`}
>
  <div class="h-full flex flex-col">
    <div class="border-b border-gray-200 pt-5 px-4">
      <div class="w-full flex flex-col items-center">
        <Avatar
          src={$profile.avatar_url}
          name={$profile.fullname}
          shape="rounded-full"
          width="w-20"
          height="h-20"
        />

        <div class="mt-5 flex justify-center w-full">
          <p
            class="dark:text-white text-lg font-bold whitespace-nowrap truncate max-w-[80%] text-center"
          >
            {$profile.fullname}
          </p>
        </div>
      </div>

      <ul class="my-5">
        {#each sideLinks as item (item.name)}
          <a href={item.link} class="text-black" on:click={toggleSidebar}>
            <li
              class="flex items-center py-3 px-4 mb-2 {NavClasses.item} {isActive(
                $page.url.pathname,
                `${item.link}`
              )
                ? NavClasses.active
                : 'dark:text-white'}"
            >
              <svelte:component this={item.icon} size={24} class="carbon-icon dark:fill-[#fff]" />
              <p class="dark:text-white ml-2">{item.name}</p>
            </li>
          </a>
        {/each}
      </ul>
    </div>
    <span class="flex-grow" />
    <ul class="my-5 pb-5 px-4">
      <a href="/lms" class="text-black" on:click={toggleSidebar}>
        <li class="flex items-center py-3 px-4 mb-2 rounded">
          <HelpIcon size={20} class="carbon-icon dark:text-white" />
          <p class="dark:text-white ml-2">{$t('lms_navigation.help')}</p>
        </li>
      </a>
      <a href="/lms/settings" class="text-black" on:click={toggleSidebar}>
        <li
          class="flex items-center py-3 px-4 mb-2 {NavClasses.item} {isActive(
            $page.url.pathname,
            `/lms/settings`
          ) && NavClasses.active}"
        >
          <Settings size={20} class="carbon-icon dark:text-white" />
          <p class="dark:text-white ml-2">{$t('lms_navigation.settings')}</p>
        </li>
      </a>
    </ul>
  </div>
</aside>
