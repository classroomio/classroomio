<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import CheckmarkFilled from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  import LockedIcon from 'carbon-icons-svelte/lib/Locked.svelte';

  import { profile } from '$lib/utils/store/user';
  import { sideBar } from '../../Org/store';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { pathway } from '$lib/components/Pathways/store';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import { getLectureNo } from '$lib/components/Course/function';
  import { getIsCourseComplete, getPathwayNavItemRoute } from '../functions';

  import TextChip from '$lib/components/Chip/Text.svelte';
  import NavExpandable from '$lib/components/Course/components/Navigation/NavExpandable.svelte';

  interface Navigation {
    label: string;
    to: string;
    icon: string;
    hideSortIcon: boolean;
    isLesson?: boolean;
    isPaidFeature: boolean;
    isExpanded?: boolean;
    show?: () => boolean;
  }

  export let path: string;
  export let isStudent: boolean = false;

  let navigation: Navigation[] = [];
  let currentPath: string;
  let id: string;
  let orgPath: string;

  const toggleSidebar = (defaultValue?: boolean) => {
    $sideBar.hidden = defaultValue ?? !$sideBar.hidden;
  };

  const toggleSidebarOnMobile = () => $isMobile && toggleSidebar();

  function handleMainGroupClick(href: string) {
    return () => {
      goto(href);
      toggleSidebarOnMobile();
    };
  }

  $: {
    currentPath = $page.url?.pathname;
    id = $page.params.id;
    orgPath = $currentOrg.siteName;
  }

  $: navigation = [
    {
      label: $t('pathways.components.sideBar.news'),
      to: getPathwayNavItemRoute($pathway.id),
      icon: 'News Feed',
      hideSortIcon: true,
      isPaidFeature: false,
      show() {
        return isStudent;
      }
    },
    {
      label: $t('pathways.components.sideBar.courses'),
      to: getPathwayNavItemRoute($pathway.id, 'courses'),
      icon: 'Courses',
      hideSortIcon: false,
      isPaidFeature: false,
      isLesson: true,
      isExpanded: isStudent ? true : $page.url.pathname.includes('/courses')
    },
    {
      label: $t('pathways.components.sideBar.people'),
      to: getPathwayNavItemRoute($pathway.id, 'people'),
      icon: 'People',
      hideSortIcon: true,
      isPaidFeature: false,
      show() {
        return !isStudent;
      }
    },
    {
      label: $t('pathways.components.sideBar.certificates'),
      to: getPathwayNavItemRoute($pathway.id, 'certificates'),
      icon: 'Certificates',
      hideSortIcon: true,
      isPaidFeature: true,
      show() {
        // Dont show students if org on free plan
        if (isStudent && $isFreePlan) {
          return false;
        }
        return true;
      }
    },
    {
      label: $t('pathways.components.sideBar.landing'),
      to: getPathwayNavItemRoute($pathway.id, 'landingpage'),
      icon: 'Pathway Landing Page',
      hideSortIcon: true,
      isPaidFeature: false,
      show() {
        return !isStudent;
      }
    },
    {
      label: $t('pathways.components.sideBar.settings'),
      to: getPathwayNavItemRoute($pathway.id, 'settings'),
      icon: 'Settings',
      hideSortIcon: true,
      isPaidFeature: false,
      show() {
        return !isStudent;
      }
    }
  ];
</script>

<aside
  class={`${
    $sideBar.hidden
      ? 'absolute z-40 -translate-x-[100%] md:relative md:translate-x-0'
      : 'absolute z-40 translate-x-0 md:relative'
  } border-r-1 h-[calc(100vh-48px)] w-[300px] min-w-[250px] overflow-y-auto border border-b-0 border-l-0 border-t-0 border-gray-100 dark:border-neutral-600 bg-gray-100 transition dark:bg-neutral-900`}
>
  <section class="bg-[#F7F7F7] dark:bg-black w-full h-full">
    <ul class="flex px-3 pt-[10%] flex-col gap-3">
      {#each navigation as nav}
        <NavExpandable
          label={nav.label}
          icon={nav.icon}
          handleClick={handleMainGroupClick(nav.to)}
          isGroupActive={(path || $page.url.pathname) === nav.to}
          total={nav.isLesson ? ($pathway.courses || []).length : 0}
          isLesson={nav.isLesson}
          isPaidFeature={nav.isPaidFeature}
          isExpanded={nav.isExpanded}
          isLoading={!$pathway.id}
        >
          {#if nav.isLesson}
            {#each $pathway.courses as item, index}
              <a
                class="pl-7 w-[95%] text-[0.80rem] mb-1 text-black dark:text-white {isStudent &&
                !item.is_unlocked
                  ? 'cursor-not-allowed'
                  : ''}"
                href="/courses/{item.id}"
                on:click={toggleSidebarOnMobile}
                aria-disabled={!item.is_unlocked}
              >
                <div
                  class="flex items-center py-3 px-4 {NavClasses.item} {(
                    path || $page.url.pathname
                  ).includes(item.id) && NavClasses.active}"
                >
                  <TextChip
                    value={getLectureNo(index + 1)}
                    className="bg-primary-200 text-primary-600 text-xs mr-2"
                    size="sm"
                    shape="rounded-full"
                  />
                  <span class="w-[70%] text-ellipsis line-clamp-2">{item.title}</span>
                  <span class="grow" />
                  {#if !item.is_unlocked}
                    <span class="text-md ml-2" title="This lesson is locked.">
                      <LockedIcon class="carbon-icon dark:text-white" />
                    </span>
                  {:else if getIsCourseComplete(item.is_completed, $profile.id)}
                    <span class="ml-2" title="You have completed this lesson">
                      <CheckmarkFilled class="carbon-icon dark:text-white" />
                    </span>
                  {/if}
                </div>
              </a>
            {/each}
          {/if}
        </NavExpandable>
      {/each}
    </ul>
  </section>
</aside>
