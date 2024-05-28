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
  import { popUp, sideBar } from '$lib/components/Org/store';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { ChevronRight } from 'carbon-icons-svelte';
  import BottomMenu from '$lib/components/Org/BottomMenu/index.svelte';

  interface sideLinks {
    name: string;
    icon: any;
    link: string;
    show?: () => boolean;
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
      link: '/lms/exercises',
      show() {
        return $currentOrg?.customization?.dashboard?.exercise;
      }
    },
    {
      name: $t('lms_navigation.community'),
      icon: CommunityIcon,
      link: '/lms/community',
      show() {
        return $currentOrg?.customization?.dashboard?.community;
      }
    }
  ].filter((link) => (link.show ? link.show() : true));

  const toggleSidebar = () => {
    $sideBar.hidden = !$sideBar.hidden;
  };
</script>

<div bind:this={$popUp.ref} class="static md:relative">
  <aside
    class={`${
      $sideBar.hidden
        ? '-translate-x-[100%] absolute md:translate-x-0 md:relative z-40 top-[48px] md:top-0'
        : 'translate-x-0 absolute md:relative z-40 top-[48px] md:top-0'
    }  overflow-y-auto transition w-[250px] min-w-[250px] bg-gray-100 dark:bg-neutral-900 h-[calc(100vh-48px)]`}
  >
    <div class="h-full flex flex-col">
      <div class="border-b border-gray-200 dark:border-neutral-600 pt-5 px-4">
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
        <button
          class="text-black no-underline cursor-pointer flex items-center justify-between mb-2 px-2.5 py-1.5 w-full {NavClasses.item}"
          on:click={() => ($popUp.open = !$popUp.open)}
        >
          <div class="flex text-start items-center justify-start space-x-1 w-[80%]">
            <Avatar
              src={$profile.avatar_url}
              name={$profile.username}
              width="w-[1.2rem]"
              height="h-[1.2rem]"
            />
            <p class="text-sm font-medium truncate max-w-full">{$profile.fullname}</p>
          </div>
          <div>
            <ChevronRight />
          </div>
        </button>
      </ul>
    </div>
  </aside>

  <BottomMenu />
</div>
