<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import hotkeys from 'hotkeys-js';
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
  import { menu, sideBar } from '$lib/components/Org/store';
  import { profile } from '$lib/utils/store/user';
  import { getIsLessonComplete } from '../Lesson/functions';

  export let path: string;
  export let isStudent: boolean = false;

  interface NavItem {
    label: string;
    to: string;
    hideSortIcon: boolean;
    isLecture?: boolean;
    show?: () => boolean;
  }

  let show: boolean = false;
  let isLessonActive: boolean = false;
  let resize = false;
  let isDragging = false;
  let startX;
  let initialWidth;
  let sidebarRef;
  let menuContentRef;

  const toggleSidebar = () => {
    $menu.hidden = !$menu.hidden;
  };

  function handleMainGroupClick(href: string) {
    return () => {
      goto(href);
      toggleSidebar();
    };
  }

  let navItems: NavItem[] = [];

  function handleMobileChange(isMobile: boolean) {
    if (isMobile) show = false;
    else show = true;
  }

  function handleCursor(event) {
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

  function startDragging(event) {
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

  function dragSidebar(event) {
    if (!(window.innerWidth >= 1024)) return;
    if (!isDragging) return;

    const deltaX = event.clientX - startX;
    let newWidth = initialWidth + deltaX;

    if (newWidth < 150) {
      sidebarRef.style.width = '0';
      menuContentRef.style.display = 'none';
      $sideBar.open = false;
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
    if (window.innerWidth >= 1024) {
      sidebarRef.addEventListener('mousedown', startDragging);
      document.addEventListener('mousemove', dragSidebar);
      document.addEventListener('mouseup', stopDragging);
      document.addEventListener('mousemove', handleCursor);
    }

    if (browser) {
      if (localStorage.getItem('hideCourseNav')) {
        show = localStorage.getItem('hideCourseNav') === 'false';
      }
    } else {
      show = true;
    }

    hotkeys('b', function (event, handler) {
      event.preventDefault();
      switch (handler.key) {
        case 'b':
          show = !show;
          break;
      }
    });
  });

  onDestroy(() => {
    if (!browser) {
      return;
    }
    if (window.innerWidth >= 1024) {
      sidebarRef.removeEventListener('mousedown', startDragging);
      document.removeEventListener('mousemove', dragSidebar);
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('mousemove', handleCursor);
    }
  });

  $: handleMobileChange($isMobile);

  $: {
    if (browser) {
      localStorage.setItem('hideCourseNav', `${!show}`);
    }
  }

  $: isLessonActive = $page.url.pathname.includes('/lessons');

  $: {
    navItems = [
      {
        label: 'Overview',
        to: getNavItemRoute($course.id),
        hideSortIcon: true
      },
      {
        label: 'Lessons',
        to: getLessonsRoute($course.id),
        hideSortIcon: false,
        isLecture: true
      },
      {
        label: 'Attendance',
        to: getNavItemRoute($course.id, 'attendance'),
        hideSortIcon: true
      },
      {
        label: 'Submissions',
        to: getNavItemRoute($course.id, 'submissions'),
        hideSortIcon: true,
        show() {
          return !isStudent;
        }
      },
      {
        label: 'Marks',
        to: getNavItemRoute($course.id, 'marks'),
        hideSortIcon: true
      },
      // {
      //   label: 'Scoreboard',
      //   to: getNavItemRoute($course.id, 'scoreboard'),
      //   hideSortIcon: true,
      // },
      {
        label: 'People',
        to: getNavItemRoute($course.id, 'people'),
        hideSortIcon: true
      },
      {
        label: 'Certificates',
        to: getNavItemRoute($course.id, 'certificates'),
        hideSortIcon: true
      },
      {
        label: 'Landing Page',
        to: getNavItemRoute($course.id, 'landingpage'),
        hideSortIcon: true,
        show() {
          return !isStudent;
        }
      },
      {
        label: 'Settings',
        to: getNavItemRoute($course.id, 'settings'),
        hideSortIcon: true,
        show() {
          return !isStudent;
        }
      }
    ];
  }
</script>

<aside
  class={`${
    $menu.hidden
      ? '-translate-x-[100%] absolute md:translate-x-0 md:relative z-[40]'
      : 'translate-x-0 absolute md:relative z-[40]'
  } transition w-[90vw] md:w-[350px] bg-gray-100 dark:bg-black h-[calc(100vh-48px)] ${
    resize && 'border-r-8 border-r-blue-500'
  } overflow-y-auto border border-l-0 border-t-0 border-b-0 border-r-1`}
  style={$sideBar.open && 'width:0' ? 'width :300px' : 'width:0'}
  bind:this={sidebarRef}
>
  <div class="sidebar-contenth-full flex flex-col">
    <ul
      class="sidebar-content my-5"
      style={$sideBar.open && 'width:0' ? 'display:block' : ''}
      bind:this={menuContentRef}
    >
      {#each navItems as navItem}
        {#if !navItem.show || (typeof navItem.show === 'function' && navItem.show())}
          <NavExpandable
            label={navItem.label}
            handleClick={handleMainGroupClick(navItem.to)}
            isGroupActive={(path || $page.url.pathname) === navItem.to}
            isExpanded={isLessonActive}
            total={navItem.isLecture ? ($lessons || []).length : 0}
            isLoading={!$course.id}
          >
            {#if navItem.isLecture}
              {#each $lessons as item, index}
                <a
                  class="pl-7 w-[95%] text-[0.80rem] mb-1 text-black dark:text-white {isStudent &&
                  !item.is_unlocked
                    ? 'cursor-not-allowed'
                    : ''}"
                  href={isStudent && !item.is_unlocked
                    ? $page.url.pathname
                    : getLessonsRoute($course.id, item.id)}
                  on:click={toggleSidebar}
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
                    <span>{item.title}</span>
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
