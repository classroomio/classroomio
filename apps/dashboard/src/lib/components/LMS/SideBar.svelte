<script lang="ts">
  import { page } from '$app/state';
  import HelpIcon from 'carbon-icons-svelte/lib/Help.svelte';
  import LicenseDraft from 'carbon-icons-svelte/lib/LicenseDraft.svelte';
  import Explore from 'carbon-icons-svelte/lib/Explore.svelte';
  import HomeIcon from '$lib/components/Icons/HomeIcon.svelte';
  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';
  import CommunityIcon from '$lib/components/Icons/CommunityIcon.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import { profile } from '$lib/utils/store/user';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import { profileMenu, sideBar } from '$lib/components/Org/store';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { ChevronRight } from 'carbon-icons-svelte';
  import ProfileMenu from '$lib/components/Org/ProfileMenu/index.svelte';
  interface SideLinks {
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

  const sideLinks: SideLinks[] = $derived.by(() =>
    [
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
      },
      {
        name: $t('lms_navigation.explore'),
        icon: Explore,
        link: '/lms/explore'
      }
    ].filter((link) => (link.show ? link.show() : true))
  );

  const toggleSidebar = () => {
    $sideBar.hidden = !$sideBar.hidden;
  };
</script>

<div bind:this={$profileMenu.ref} class="static md:relative">
  <aside
    class={`${
      $sideBar.hidden
        ? 'absolute top-[48px] z-40 -translate-x-[100%] md:relative md:top-0 md:translate-x-0'
        : 'absolute top-[48px] z-40 translate-x-0 md:relative md:top-0'
    }  h-[calc(100vh-48px)] w-[250px] min-w-[250px] overflow-y-auto bg-gray-100 transition dark:bg-neutral-900`}
  >
    <div class="flex h-full flex-col">
      <div class="border-b border-gray-200 px-4 pt-5 dark:border-neutral-600">
        <div class="flex w-full flex-col items-center">
          <Avatar src={$profile.avatar_url} name={$profile.fullname} shape="rounded-full" width="w-20" height="h-20" />

          <div class="mt-5 flex w-full justify-center">
            <p class="max-w-[80%] truncate whitespace-nowrap text-center text-lg font-bold dark:text-white">
              {$profile.fullname}
            </p>
          </div>
        </div>

        <ul class="my-5">
          {#each sideLinks as item}
            <a href={item.link} class="text-black" onclick={toggleSidebar}>
              <li
                class="mb-2 flex items-center px-4 py-3 {NavClasses.item} {isActive(page.url.pathname, `${item.link}`)
                  ? NavClasses.active
                  : 'dark:text-white'}"
              >
                <item.icon size={24} class="carbon-icon dark:fill-[#fff]" />
                <p class="ml-2 dark:text-white">{item.name}</p>
              </li>
            </a>
          {/each}
        </ul>
      </div>
      <span class="flex-grow"></span>
      <ul class="my-5 px-4 pb-5">
        <a href="/lms" class="text-black" onclick={toggleSidebar}>
          <li class="mb-2 flex items-center rounded px-4 py-3">
            <HelpIcon size={20} class="carbon-icon dark:text-white" />
            <p class="ml-2 dark:text-white">{$t('lms_navigation.help')}</p>
          </li>
        </a>
        <button
          class="w-full"
          onclick={() => {
            $profileMenu.open = !$profileMenu.open;
            $sideBar.hidden = true;
          }}
        >
          <div
            class="mb-2 flex w-full cursor-pointer items-center justify-between px-2.5 py-1.5 text-black no-underline {NavClasses.item}"
          >
            <div class="flex items-center justify-start space-x-1 text-start">
              <Avatar src={$profile.avatar_url} name={$profile.username} width="w-[1.2rem]" height="h-[1.2rem]" />
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
