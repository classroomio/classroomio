<script>
  import { onMount } from 'svelte';
  import { stores, goto } from '@sapper/app';
  import hotkeys from 'hotkeys-js';
  import Home32 from 'carbon-icons-svelte/lib/Home32';
  import CheckmarkFilled20 from 'carbon-icons-svelte/lib/CheckmarkFilled20';
  import Settings20 from 'carbon-icons-svelte/lib/Settings20';
  import ChevronLeft16 from 'carbon-icons-svelte/lib/ChevronLeft16';
  import ChevronRight16 from 'carbon-icons-svelte/lib/ChevronRight16';
  import NavExpandable from './NavExpandable.svelte';
  import PageNav from '../../../PageNav/index.svelte';
  import IconButton from '../../../IconButton/index.svelte';
  import Avatar from '../../../Avatar/index.svelte';
  import {
    getNavItemRoute,
    getLessonsRoute,
    getLectureNo,
  } from '../../function';

  import RoleBasedSecurity from '../../../RoleBasedSecurity/index.svelte';
  import Settings from '../Settings/index.svelte';
  import { settingsDialog } from '../Settings/store';
  import { lessons } from '../Lesson/store/lessons';
  import { course, group } from '../../store';
  import { updateCourse } from '../../../../utils/services/courses';
  import { profile } from '../../../../utils/store/user';
  import { isMobile } from '../../../../utils/store/useMobile';

  // export let lessonId;
  export let path;
  export let isStudent = null;
  let show = null;

  const { page } = stores();

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
    // return item.is_complete ? item.to : path || $page.path
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
    if (process.browser && show !== null) {
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
    ];
  }
</script>

<Settings />

<div
  class="root z-10 {!show && 'hide'} {$isMobile ? 'fixed shadow-xl' : 'sticky'}"
>
  {#if show}
    <div class="relative h-full">
      <PageNav bind:title={$course.title} paddingClass="pl-2">
        <slot:fragment slot="image">
          <Avatar src={$course.logo} />
        </slot:fragment>
        <slot:fragment slot="widget">
          <RoleBasedSecurity allowedRoles="[1,2]">
            <IconButton
              onClick={() => ($settingsDialog.open = !$settingsDialog.open)}
            >
              <Settings20 class="carbon-icon" />
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
              isGroupActive={(path || $page.path) === navItem.to}
              hideSortIcon={navItem.hideSortIcon}
            >
              {#if navItem.isLecture}
                {#each $lessons as item, index}
                  <a
                    class="item flex items-center {(
                      path || $page.path
                    ).includes(item.id) && 'active'} pl-7 py-2 {isStudent &&
                    !item.is_complete
                      ? 'cursor-not-allowed'
                      : ''}"
                    href={isStudent && !item.is_complete
                      ? $page.path
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
                        <CheckmarkFilled20 class="carbon-icon" />
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
          onClick={() => goto('/courses')}
          buttonClassName="mx-3"
        >
          <Home32 class="carbon-icon" />
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
      toolTipProps={$isMobile
        ? {}
        : {
            title: 'Toggle sidebar',
            hotkeys: ['B'],
            direction: 'right',
          }}
    >
      {#if show}
        <ChevronLeft16 class="carbon-icon" />
      {:else}
        <ChevronRight16 class="carbon-icon" />
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
    &:hover {
      background-color: #cae2f9;
    }
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
