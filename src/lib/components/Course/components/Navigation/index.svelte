<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import hotkeys from 'hotkeys-js';
  import HomeIcon from 'carbon-icons-svelte/lib/Home.svelte';
  import CheckmarkFilledIcon from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  import SettingsIcon from 'carbon-icons-svelte/lib/Settings.svelte';
  import ChevronLeftIcon from 'carbon-icons-svelte/lib/ChevronLeft.svelte';
  import ChevronRightIcon from 'carbon-icons-svelte/lib/ChevronRight.svelte';
  import NavExpandable from './NavExpandable.svelte';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import {
    getNavItemRoute,
    getLessonsRoute,
    getLectureNo,
  } from '$lib/components/Course/function';

  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import Settings from '../Settings/index.svelte';
  import { settingsDialog } from '../Settings/store';
  import { lessons } from '../Lesson/store/lessons';
  import { course } from '$lib/components/Course/store';
  import { updateCourse } from '$lib/utils/services/courses';
  import { profile } from '$lib/utils/store/user';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { browser } from '$app/environment';

  // export let lessonId;
  export let path;
  export let isStudent = null;
  let show = null;

  function handleMainGroupClick(href) {
    return () => {
      if ($isMobile) {
        setTimeout(() => (show = false), 500);
      }
      goto(href);
    };
  }

  let navItems = [];

  function getHref(item) {
    return item.to;
    // return item.is_complete ? item.to : path || $page.url.pathname
  }

  function handleSaveTitle() {
    updateCourse($course.id, { title: $course.title });
  }

  function handleMobileChange(isMobile) {
    if (isMobile) show = false;
    else show = true;
  }

  onMount(() => {
    if (localStorage.getItem('hideCourseNav')) {
      show = localStorage.getItem('hideCourseNav') === 'false';
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

  $: {
    navItems = [
      {
        label: 'Overview',
        to: getNavItemRoute($course.id),
        hideSortIcon: true,
      },
      {
        label: 'Lessons',
        to: getLessonsRoute($course.id),
        hideSortIcon: false,
        isLecture: true,
      },
      {
        label: 'Attendance',
        to: getNavItemRoute($course.id, 'attendance'),
        hideSortIcon: true,
      },
      {
        label: 'Submissions',
        to: getNavItemRoute($course.id, 'submissions'),
        hideSortIcon: true,
        show() {
          return !isStudent;
        },
      },
      {
        label: 'Marks',
        to: getNavItemRoute($course.id, 'marks'),
        hideSortIcon: true,
      },
      // {
      //   label: 'Scoreboard',
      //   to: getNavItemRoute($course.id, 'scoreboard'),
      //   hideSortIcon: true,
      // },
      {
        label: 'People',
        to: getNavItemRoute($course.id, 'people'),
        hideSortIcon: true,
      },
      {
        label: 'Certificates',
        to: getNavItemRoute($course.id, 'certificates'),
        hideSortIcon: true,
      },
      {
        label: 'Landing Page',
        to: getNavItemRoute($course.id, 'landingpage'),
        hideSortIcon: true,
        show() {
          return !isStudent;
        },
      },
    ];
  }
</script>

<Settings />

<div
  class="root z-10 {!show && 'hide'} {$isMobile ? 'fixed shadow-xl' : 'sticky'}"
>
  {#if show}
    <div class="relative h-full dark:bg-gray-700">
      <PageNav bind:title={$course.title} paddingClass="pl-2">
        <slot:fragment slot="image">
          <Avatar src={$course.logo} />
        </slot:fragment>
        <slot:fragment slot="widget">
          <RoleBasedSecurity allowedRoles={[1, 2]}>
            <IconButton
              onClick={() => ($settingsDialog.open = !$settingsDialog.open)}
            >
              <SettingsIcon size={20} class="carbon-icon" />
            </IconButton>
          </RoleBasedSecurity>
        </slot:fragment>
      </PageNav>
      <div class="navItems">
        {#each navItems as navItem}
          {#if !navItem.show || (typeof navItem.show === 'function' && navItem.show())}
            <NavExpandable
              label={navItem.label}
              handleClick={handleMainGroupClick(navItem.to)}
              isGroupActive={(path || $page.url.pathname) === navItem.to}
              hideSortIcon={navItem.hideSortIcon}
            >
              {#if navItem.isLecture}
                {#each $lessons as item, index}
                  <a
                    class="item flex items-center {(
                      path || $page.url.pathname
                    ).includes(item.id) && 'active'} pl-7 py-3 {isStudent &&
                    !item.is_complete
                      ? 'cursor-not-allowed'
                      : ''}"
                    href={isStudent && !item.is_complete
                      ? $page.url.pathname
                      : getLessonsRoute($course.id, item.id)}
                    on:click={() => {
                      if ($isMobile) {
                        setTimeout(() => (show = false), 500);
                      }
                    }}
                  >
                    <span class="course-counter">
                      {getLectureNo(index + 1)}
                    </span>
                    <span>{item.title}</span>
                    {#if item.is_complete}
                      <span class="ml-2 success">
                        <CheckmarkFilledIcon size={20} class="carbon-icon" />
                      </span>
                    {:else}
                      <span class="text-md ml-2">🔒</span>
                    {/if}
                  </a>
                {/each}
              {/if}
            </NavExpandable>
          {/if}
        {/each}
      </div>

      <div
        class="w-full footer p-3 absolute bottom-2 flex items-center justify-between"
      >
        <IconButton
          value="toggle"
          onClick={() => goto(`${$currentOrgPath}/courses`)}
          buttonClassName="mx-3"
        >
          <HomeIcon size={32} class="carbon-icon" />
        </IconButton>
        <a class="block mx-3" href={`/profile/${$profile.id}`}>
          <Avatar src={$profile.avatar_url} name={$profile.username} />
        </a>
      </div>
    </div>
  {/if}
  <div class="toggler rounded-full shadow-lg absolute bottom-0">
    <IconButton
      value="toggle"
      onClick={() => (show = !show)}
      size={$isMobile ? 'large' : 'small'}
      color="text-black"
      toolTipProps={$isMobile
        ? {}
        : {
            title: 'Toggle sidebar',
            hotkeys: ['B'],
            direction: 'right',
          }}
    >
      {#if show}
        <ChevronLeftIcon size={16} />
      {:else}
        <ChevronRightIcon size={16} />
      {/if}
    </IconButton>
  </div>
</div>

<style lang="scss">
  .root {
    height: 100vh;
    display: flex;
    flex-direction: column;
    min-width: 360px;
    max-width: 360px;
    top: 0;
    border-right: 1px solid var(--border-color);
    background-color: rgb(250, 251, 252);

    &.hide {
      min-width: 15px;
      max-width: 15px;
    }
  }

  .footer {
    border-top: 1px solid var(--border-color);
    height: 50px;
  }

  .active {
    background-color: #cae2f9;
    border-left: 3px solid var(--main-primary-color);
    padding-left: 1.5rem;
  }
  .course-counter {
    font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace;
    background-color: inherit;
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1.5;
    margin-right: 1.5rem;
  }

  .item {
    font-size: 0.875rem;
    font-weight: bold;
    &:hover {
      background-color: #cae2f9;
    }
  }
  :global(body.dark) .active,
  :global(body.dark) .item:hover {
    background-color: rgba(107, 114, 128);
  }

  .navItems {
    height: 82%;
    overflow-y: auto;
  }

  .toggler {
    right: -15px;
    z-index: 10;
    border: 1px solid var(--border-color);
    top: 50px;
    height: fit-content;
    background: var(--border-color);
  }

  @media (max-width: 760px) {
    .root {
      width: 98%;
      min-width: unset;
      max-width: unset;
    }
  }
</style>
