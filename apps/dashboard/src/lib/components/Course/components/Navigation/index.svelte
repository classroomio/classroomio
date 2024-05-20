<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import LockedIcon from 'carbon-icons-svelte/lib/Locked.svelte';
  import CheckmarkFilled from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  import NavExpandable from './NavExpandable.svelte';
  import { getNavItemRoute, getLessonsRoute, getLectureNo } from '$lib/components/Course/function';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import { lessons } from '../Lesson/store/lessons';
  import { course } from '$lib/components/Course/store';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { sideBar } from '$lib/components/Org/store';
  import { profile } from '$lib/utils/store/user';
  import { getIsLessonComplete } from '../Lesson/functions';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { COURSE_TYPE } from '$lib/components/Courses/constants';

  export let path: string;
  export let isStudent: boolean = false;

  interface NavItem {
    label: string;
    to: string;
    hideSortIcon: boolean;
    isLesson?: boolean;
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
        label: $t('course.navItems.nav_news_feed'),
        to: getNavItemRoute($course.id),
        hideSortIcon: true,
        isPaidFeature: false,
        show() {
          if ($course.course_type == COURSE_TYPE.LIVE_CLASS) {
            return isStudent ? $currentOrg.customization.course.newsfeed : true;
          }

          return false;
        }
      },
      {
        label: $t('course.navItems.nav_lessons'),
        to: getLessonsRoute($course.id),
        hideSortIcon: false,
        isPaidFeature: false,
        isLesson: true,
        isExpanded: isStudent ? true : $page.url.pathname.includes('/lessons')
      },
      {
        label: $t('course.navItems.nav_attendance'),
        to: getNavItemRoute($course.id, 'attendance'),
        isPaidFeature: false,
        hideSortIcon: true,
        show() {
          if ($course.course_type !== COURSE_TYPE.LIVE_CLASS) return false;

          return true;
        }
      },
      {
        label: $t('course.navItems.nav_submissions'),
        to: getNavItemRoute($course.id, 'submissions'),
        hideSortIcon: true,
        isPaidFeature: false,
        show() {
          if (isStudent) return false;

          if ($course.course_type !== COURSE_TYPE.LIVE_CLASS) return false;

          return true;
        }
      },
      {
        label: $t('course.navItems.nav_marks'),
        to: getNavItemRoute($course.id, 'marks'),
        isPaidFeature: false,
        hideSortIcon: true,
        show() {
          if ($course.course_type == COURSE_TYPE.LIVE_CLASS) {
            return isStudent ? $currentOrg.customization.course.grading : true;
          }

          return false;
        }
      },
      {
        label: $t('course.navItems.nav_people'),
        to: getNavItemRoute($course.id, 'people'),
        isPaidFeature: false,
        hideSortIcon: true,
        show() {
          return !isStudent;
        }
      },
      {
        label: $t('course.navItems.nav_certificates'),
        to: getNavItemRoute($course.id, 'certificates'),
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
        label: $t('course.navItems.nav_landing_page'),
        to: getNavItemRoute($course.id, 'landingpage'),
        hideSortIcon: true,
        isPaidFeature: false,
        show() {
          return !isStudent;
        }
      },
      {
        label: $t('course.navItems.nav_settings'),
        to: getNavItemRoute($course.id, 'settings'),
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
      ? '-translate-x-[100%] absolute z-[40]'
      : 'translate-x-0 absolute md:relative z-[40]'
  }
    transition w-[90vw] md:w-[300px] lg:w-[350px] bg-gray-100 dark:bg-black h-[calc(100vh-48px)] 
  
  ${
    resize ? 'border-r-8 border-r-blue-500' : 'dark:border-r-neutral-600'
  } overflow-y-auto border border-l-0 border-t-0 border-b-0 border-r-1`}
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
            handleClick={handleMainGroupClick(navItem.to)}
            isGroupActive={(path || $page.url.pathname) === navItem.to}
            total={navItem.isLesson ? ($lessons || []).length : 0}
            isLoading={!$course.id}
            isLesson={navItem.isLesson}
            isPaidFeature={navItem.isPaidFeature}
            isExpanded={navItem.isExpanded}
            {isStudent}
          >
            {#if navItem.isLesson}
              {#each $lessons as item, index}
                <a
                  class="pl-7 w-[95%] text-[0.80rem] mb-1 text-black dark:text-white {isStudent &&
                  !item.is_unlocked
                    ? 'cursor-not-allowed'
                    : ''}"
                  href={isStudent && !item.is_unlocked
                    ? $page.url.pathname
                    : getLessonsRoute($course.id, item.id)}
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
                    {:else if getIsLessonComplete(item.lesson_completion, $profile.id)}
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
