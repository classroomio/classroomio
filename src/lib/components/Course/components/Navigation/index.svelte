<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import hotkeys from 'hotkeys-js';
  import { browser } from '$app/environment';
  import LockedIcon from 'carbon-icons-svelte/lib/Locked.svelte';
  // import ArrowLeftIcon from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import CheckmarkFilled from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  // import SettingsIcon from 'carbon-icons-svelte/lib/Settings.svelte';
  import ChevronLeftIcon from 'carbon-icons-svelte/lib/ChevronLeft.svelte';
  import ChevronRightIcon from 'carbon-icons-svelte/lib/ChevronRight.svelte';
  import NavExpandable from './NavExpandable.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  // import Avatar from '$lib/components/Avatar/index.svelte';
  import { getNavItemRoute, getLessonsRoute, getLectureNo } from '$lib/components/Course/function';

  import TextChip from '$lib/components/Chip/Text.svelte';
  // import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import Settings from '../Settings/index.svelte';
  // import { settingsDialog } from '../Settings/store';
  import { lessons } from '../Lesson/store/lessons';
  import { course } from '$lib/components/Course/store';
  import { updateCourse } from '$lib/utils/services/courses';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { menu } from '$lib/components/Org/store';

  // export let lessonId;
  export let path;
  export let isStudent = null;

  let show = null;
  let isLessonActive = false;

  const toggleSidebar = () => {
    $menu.hidden = !$menu.hidden;
  };

  function handleMainGroupClick(href) {
    return () => {
      goto(href);
      toggleSidebar();
    };
  }

  let navItems = [];

  function getHref(item) {
    return item.to;
    // return item.is_unlocked ? item.to : path || $page.url.pathname
  }

  function handleSaveTitle() {
    updateCourse($course.id, { title: $course.title });
  }

  function handleMobileChange(isMobile) {
    if (isMobile) show = false;
    else show = true;
  }

  onMount(() => {
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
      }
    ];
  }
</script>

<Settings />

<aside
  class={`${
    $menu.hidden
      ? '-translate-x-[100%] absolute md:translate-x-0 md:relative z-[40]'
      : 'translate-x-0 absolute md:relative z-[40]'
  } transition w-[350px] min-w-[350px] md:max-w-[350px] bg-gray-100 dark:bg-gray-800 h-[calc(100vh-48px)] overflow-y-auto border border-l-0 border-t-0 border-b-0 border-r-1`}
>
  <div class="h-full flex flex-col">
    <ul class="my-5">
      {#each navItems as navItem}
        {#if !navItem.show || (typeof navItem.show === 'function' && navItem.show())}
          <NavExpandable
            label={navItem.label}
            handleClick={handleMainGroupClick(navItem.to)}
            isGroupActive={(path || $page.url.pathname) === navItem.to}
            isExpanded={isLessonActive}
            total={navItem.isLecture ? ($lessons || []).length : 0}
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
                    {:else if item.is_complete}
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
