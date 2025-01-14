<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import { getLectureNo, getLessonsRoute, getNavItemRoute } from '$lib/components/Course/function';
  import { course } from '$lib/components/Course/store';
  import { sideBar } from '$lib/components/Org/store';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { profile } from '$lib/utils/store/user';
  import { COURSE_TYPE, COURSE_VERSION, type Lesson } from '$lib/utils/types';
  import CheckmarkFilled from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  import LockedIcon from 'carbon-icons-svelte/lib/Locked.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { getIsLessonComplete } from '../Lesson/functions';
  import { lessons, lessonSections } from '../Lesson/store/lessons';
  import { NAV_IDS } from './constants';
  import NavExpandable from './NavExpandable.svelte';

  export let path: string;
  export let isStudent: boolean = false;

  interface Section {
    id: string;
    order: number;
    label: string;
    lessons: Lesson[];
    isExpanded?: boolean;
  }
  interface NavItem {
    id: string;
    label: string;
    to: string;
    icon: string;
    hideSortIcon: boolean;
    isLesson?: boolean;
    isPaidFeature: boolean;
    isExpanded?: boolean;
    sections?: Section[];
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
        id: NAV_IDS.NEWS_FEED,
        label: $t('course.navItems.nav_news_feed'),
        to: getNavItemRoute($course.id),
        icon: 'News Feed',
        hideSortIcon: true,
        isPaidFeature: false,
        show() {
          return isStudent ? $currentOrg.customization.course.newsfeed : true;
        }
      },
      {
        id: NAV_IDS.LESSONS,
        label: $t('course.navItems.nav_content'),
        to: getLessonsRoute($course.id),
        icon: 'Lessons',
        hideSortIcon: false,
        isPaidFeature: false,
        isLesson: true,
        sections: $lessonSections.map((section) => ({
          ...section,
          label: section.title,
          isExpanded: true
        })),
        isExpanded: isStudent ? true : $page.url.pathname.includes('/lessons')
      },
      {
        id: NAV_IDS.ATTENDANCE,
        label: $t('course.navItems.nav_attendance'),
        to: getNavItemRoute($course.id, 'attendance'),
        icon: 'Attendance',
        isPaidFeature: false,
        hideSortIcon: true,
        show() {
          if ($course.type !== COURSE_TYPE.LIVE_CLASS) return false;

          return true;
        }
      },
      {
        id: NAV_IDS.SUBMISSIONS,
        label: $t('course.navItems.nav_submissions'),
        to: getNavItemRoute($course.id, 'submissions'),
        icon: 'Submissions',
        hideSortIcon: true,
        isPaidFeature: false,
        show() {
          if (isStudent) return false;

          return true;
        }
      },
      {
        id: NAV_IDS.MARKS,
        label: $t('course.navItems.nav_marks'),
        to: getNavItemRoute($course.id, 'marks'),
        icon: 'Marks',
        isPaidFeature: false,
        hideSortIcon: true,
        show() {
          if ($course.type == COURSE_TYPE.LIVE_CLASS) {
            return isStudent ? $currentOrg.customization.course.grading : true;
          }

          return false;
        }
      },
      {
        id: NAV_IDS.CERTIFICATES,
        label: $t('course.navItems.nav_certificates'),
        to: getNavItemRoute($course.id, 'certificates'),
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
        id: NAV_IDS.LANDING_PAGE,
        label: $t('course.navItems.nav_landing_page'),
        to: getNavItemRoute($course.id, 'landingpage'),
        icon: 'Landing Page',
        hideSortIcon: true,
        isPaidFeature: false,
        show() {
          return !isStudent;
        }
      },
      {
        id: NAV_IDS.PEOPLE,
        label: $t('course.navItems.nav_people'),
        to: getNavItemRoute($course.id, 'people'),
        icon: 'People',
        isPaidFeature: false,
        hideSortIcon: true,
        show() {
          return !isStudent;
        }
      },
      {
        id: NAV_IDS.SETTINGS,
        label: $t('course.navItems.nav_settings'),
        to: getNavItemRoute($course.id, 'settings'),
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
    h-[calc(100vh-48px)] w-[90vw] bg-gray-100 transition md:w-[300px] lg:w-[350px] dark:bg-black 
  
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
            id={navItem.id}
            label={navItem.label}
            handleClick={handleMainGroupClick(navItem.to)}
            isGroupActive={(path || $page.url.pathname) === navItem.to}
            total={navItem.isLesson ? ($lessons || []).length : 0}
            isLoading={!$course.id}
            isLesson={navItem.isLesson}
            isPaidFeature={navItem.isPaidFeature}
            isExpanded={navItem.isExpanded}
            {isStudent}
          >
            {#if $course.version === COURSE_VERSION.V1}
              {#each $lessons as item, index}
                <a
                  class="mb-2 w-[95%] pl-7 text-[0.80rem] text-black dark:text-white {isStudent &&
                  !item.is_unlocked
                    ? 'cursor-not-allowed'
                    : ''}"
                  href={isStudent && !item.is_unlocked
                    ? $page.url.pathname
                    : getLessonsRoute($course.id, item.id)}
                  on:click={toggleSidebarOnMobile}
                  aria-disabled={!item.is_unlocked}
                  title={item.title}
                >
                  <div
                    class="flex items-center px-4 py-2 {NavClasses.item} {(
                      path || $page.url.pathname
                    ).includes(item.id) && NavClasses.active}"
                  >
                    <TextChip
                      value={getLectureNo(index + 1)}
                      className="bg-primary-200 text-primary-600 text-xs mr-2"
                      size="sm"
                      shape="rounded-full"
                    />
                    <span class="line-clamp-2 w-[85%] text-ellipsis">{item.title}</span>
                    <span class="grow" />
                    {#if !item.is_unlocked}
                      <span class="text-md ml-2" title="This lesson is locked.">
                        <LockedIcon class="carbon-icon dark:text-white" />
                      </span>
                    {:else if getIsLessonComplete(item.lesson_completion, $profile.id)}
                      <span class="ml-2" title="You have completed this lesson">
                        <CheckmarkFilled class="carbon-icon dark:text-white" />
                      </span>
                    {/if}
                  </div>
                </a>
              {/each}
            {:else if navItem.sections}
              {#each navItem.sections as section}
                <NavExpandable
                  id={section.id}
                  label={section.label}
                  isLoading={!$course.id}
                  isSection={true}
                  isExpanded={section.isExpanded}
                  className="ml-4"
                  btnPadding="py-2 px-3"
                  {isStudent}
                >
                  {#each section.lessons as item}
                    <a
                      class="mb-2 w-[95%] pl-7 text-[0.80rem] text-black dark:text-white {isStudent &&
                      !item.is_unlocked
                        ? 'cursor-not-allowed'
                        : ''}"
                      href={isStudent && !item.is_unlocked
                        ? $page.url.pathname
                        : getLessonsRoute($course.id, item.id)}
                      on:click={toggleSidebarOnMobile}
                      aria-disabled={!item.is_unlocked}
                      title={item.title}
                    >
                      <div
                        class="flex items-center px-4 py-2 {NavClasses.item} {(
                          path || $page.url.pathname
                        ).includes(item.id) && NavClasses.active}"
                      >
                        <span class="line-clamp-2 w-[85%] text-ellipsis">{item.title}</span>
                        <span class="grow" />
                        {#if !item.is_unlocked}
                          <span class="text-md ml-2" title="This lesson is locked.">
                            <LockedIcon class="carbon-icon dark:text-white" />
                          </span>
                        {:else if getIsLessonComplete(item.lesson_completion, $profile.id)}
                          <span class="ml-2" title="You have completed this lesson">
                            <CheckmarkFilled class="carbon-icon dark:text-white" />
                          </span>
                        {/if}
                      </div>
                    </a>
                  {/each}
                </NavExpandable>
              {/each}
            {/if}
          </NavExpandable>
        {/if}
      {/each}
    </ul>
  </div>
</aside>
