<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import CheckmarkFilled from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  import LockedIcon from 'carbon-icons-svelte/lib/Locked.svelte';
  import { onDestroy, onMount } from 'svelte';

  import { sideBar } from '$lib/components/Org/store';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { profile } from '$lib/utils/store/user';
  import { pathway, pathwayCourses } from '../store';

  import { getLectureNo } from '$lib/components/Course/function';
  import { t } from '$lib/utils/functions/translations';
  import { getIsCourseComplete, getPathwayNavItemRoute } from '../functions';

  import TextChip from '$lib/components/Chip/Text.svelte';
  import NavExpandable from '$lib/components/Course/components/Sidebar/NavExpandable.svelte';

  export let path: string;
  export let isStudent: boolean = false;

  interface NavItem {
    id: string;
    label: string;
    to: string;
    icon: string;
    hideSortIcon: boolean;
    isCourses?: boolean;
    isPaidFeature: boolean;
    isExpanded?: boolean;
    show?: () => boolean;
  }

  let resize = false;
  let isDragging = false;
  let startX: number;
  let initialWidth: number;
  let sidebarRef: HTMLElement;
  let menuContentRef: HTMLUListElement;

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

  let navItems: NavItem[] = [];

  function handleCursor(event: MouseEvent) {
    if (!resize && sidebarRef) {
      const isNearLeftBorder = event.clientX - sidebarRef.getBoundingClientRect().left < 8;
      const isNearRightBorder = sidebarRef.getBoundingClientRect().right - event.clientX < 8;

      if (isNearLeftBorder || isNearRightBorder) {
        sidebarRef.style.cursor = 'ew-resize';
      } else {
        sidebarRef.style.cursor = 'auto';
      }
    }
  }

  function startDragging(event: MouseEvent) {
    if (event.button === 0 && sidebarRef) {
      event.preventDefault();

      const isNearRightBorder = sidebarRef.getBoundingClientRect().right - event.clientX < 8;
      const isNearLeftBorder = event.clientX - sidebarRef.getBoundingClientRect().left < 8;

      if (
        (isNearRightBorder || isNearLeftBorder) &&
        event.clientX >= 0 &&
        event.clientX <= window.innerWidth
      ) {
        isDragging = true;
        resize = true;
        startX = event.clientX;
        initialWidth = parseInt(getComputedStyle(sidebarRef).width, 10);
      }
    }
  }

  function stopDragging() {
    isDragging = false;
    resize = false;
  }

  function dragSidebar(event: MouseEvent) {
    if (!(window.innerWidth >= 1024)) return;
    if (!isDragging) return;

    const deltaX = event.clientX - startX;
    let newWidth = initialWidth + deltaX;

    if (newWidth < 150) {
      sidebarRef.style.width = '0';
      menuContentRef.style.display = 'none';
      $sideBar.hidden = true;
      isDragging = false;
      resize = false;
    } else if (newWidth > window.innerWidth / 3 && window.innerWidth >= 1280) {
      sidebarRef.style.width = '40vw';
    } else if (newWidth > window.innerWidth / 4 && window.innerWidth < 1280) {
      sidebarRef.style.width = '28vw';
    } else {
      sidebarRef.style.width = newWidth + 'px';
      menuContentRef.style.display = 'block';
    }
  }

  onMount(() => {
    if (!$isMobile) {
      sidebarRef.addEventListener('mousedown', startDragging);
      document.addEventListener('mousemove', dragSidebar);
      document.addEventListener('mouseup', stopDragging);
      document.addEventListener('mousemove', handleCursor);
      toggleSidebar(false);
    }
  });

  onDestroy(() => {
    if (!browser) {
      return;
    }
    if (!$isMobile) {
      sidebarRef.removeEventListener('mousedown', startDragging);
      document.removeEventListener('mousemove', dragSidebar);
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('mousemove', handleCursor);
    }
  });

  $: {
    navItems = [
      {
        id: 'NEWS_FEED',
        label: $t('pathway.components.sideBar.news'),
        to: getPathwayNavItemRoute($pathway.id),
        icon: 'News Feed',
        hideSortIcon: true,
        isPaidFeature: false,
        show() {
          return isStudent ? $currentOrg.customization.course.newsfeed : true;
        }
      },
      {
        id: 'COURSES',
        label: $t('pathway.components.sideBar.courses'),
        to: getPathwayNavItemRoute($pathway.id, 'courses'),
        icon: 'Courses',
        hideSortIcon: false,
        isPaidFeature: false,
        isCourses: true,
        isExpanded: isStudent ? true : $page.url.pathname.includes('/courses')
      },
      {
        id: 'PEOPLE',
        label: $t('pathway.components.sideBar.people'),
        to: getPathwayNavItemRoute($pathway.id, 'people'),
        icon: 'People',
        isPaidFeature: false,
        hideSortIcon: true,
        show() {
          return !isStudent;
        }
      },
      {
        id: 'CERTIFICATES',
        label: $t('pathway.components.sideBar.certificates'),
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
        id: 'LANDING_PAGE',
        label: $t('pathway.components.sideBar.landing'),
        to: getPathwayNavItemRoute($pathway.id, 'landingpage'),
        icon: 'Landing Page',
        hideSortIcon: true,
        isPaidFeature: false,
        show() {
          return !isStudent;
        }
      },
      {
        id: 'SETTINGS',
        label: $t('pathway.components.sideBar.settings'),
        to: getPathwayNavItemRoute($pathway.id, 'settings'),
        icon: 'Settings',
        hideSortIcon: true,
        isPaidFeature: false,
        show() {
          return !isStudent;
        }
      }
    ];
  }
</script>

<aside
  class={`
  ${
    $sideBar.hidden
      ? 'absolute z-[40] -translate-x-[100%]'
      : 'absolute z-[40] translate-x-0 md:relative'
  }
    h-[calc(100vh-48px)] w-[90vw] bg-gray-100 transition dark:bg-black md:w-[300px] lg:w-[350px] 
  
  ${
    resize ? 'border-r-8 border-r-blue-500' : 'dark:border-r-neutral-600'
  } border-r-1 overflow-y-auto border border-b-0 border-l-0 border-t-0`}
  style={$sideBar.hidden === true ? 'width:0' : 'width:300px'}
  bind:this={sidebarRef}
>
  <div class="flex flex-col">
    <ul
      class="sidebar-content my-5"
      bind:this={menuContentRef}
      style={$sideBar.hidden === true ? '' : 'display:block'}
    >
      {#each navItems as navItem}
        {#if !navItem.show || (typeof navItem.show === 'function' && navItem.show())}
          <NavExpandable
            label={navItem.label}
            id={navItem.id}
            handleClick={handleMainGroupClick(navItem.to)}
            isGroupActive={(path || $page.url.pathname) === navItem.to}
            total={navItem.isCourses ? ($pathwayCourses || []).length : 0}
            isLoading={!$pathway.id}
            isLesson={navItem.isCourses}
            isPaidFeature={navItem.isPaidFeature}
            isExpanded={navItem.isExpanded}
            {isStudent}
            addIconClick={() => console.log('open add course modal')}
          >
            {#if navItem.isCourses}
              {#each $pathwayCourses as item, index}
                <a
                  class="mb-1 w-[95%] pl-7 text-[0.80rem] text-black dark:text-white {isStudent &&
                  !item.is_unlocked
                    ? 'cursor-not-allowed'
                    : ''}"
                  href={`/courses/${item.course_id}`}
                  on:click={!item.is_unlocked ? (e) => e.preventDefault() : toggleSidebarOnMobile}
                  aria-disabled={!item.is_unlocked}
                >
                  <div
                    class="flex items-center px-4 py-3 {NavClasses.item} {(
                      path || $page.url.pathname
                    ).includes(item.id) && NavClasses.active}"
                  >
                    <TextChip
                      value={getLectureNo(index + 1)}
                      className="bg-primary-200 text-primary-600 text-xs mr-2"
                      size="sm"
                      shape="rounded-full"
                    />
                    <span class="line-clamp-2 w-[70%] text-ellipsis">{item.course.title}</span>
                    <span class="grow" />
                    {#if !item.is_unlocked}
                      <span class="text-md ml-2" title="This lesson is locked.">
                        <LockedIcon class="carbon-icon dark:text-white" />
                      </span>
                    {:else if getIsCourseComplete(item.course.lesson[0], $profile.id)}
                      <span class="ml-2" title="You have completed this lesson">
                        <CheckmarkFilled class="carbon-icon dark:text-white" />
                      </span>
                    {/if}
                  </div>
                </a>
              {/each}
            {/if}
          </NavExpandable>
        {/if}
      {/each}
    </ul>
  </div>
</aside>
