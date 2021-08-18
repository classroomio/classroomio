<script>
  import { onMount } from 'svelte';
  import CheckmarkFilled20 from 'carbon-icons-svelte/lib/CheckmarkFilled20';
  import hotkeys from 'hotkeys-js';
  import ChevronLeft32 from 'carbon-icons-svelte/lib/ChevronLeft32';
  import ChevronRight32 from 'carbon-icons-svelte/lib/ChevronRight32';
  import { stores, goto } from '@sapper/app';
  import Expandable from '../../../Expandable/index.svelte';
  import PageNav from '../../../PageNav/index.svelte';
  import IconButton from '../../../IconButton/index.svelte';
  import {
    getNavItemRoute,
    getLessonsRoute,
    getLectureNo,
  } from '../../function';

  import { lessons } from '../Lesson/store/lessons';
  import { course } from '../../store';
  import { updateCourse } from '../../../../utils/services/courses';

  // export let lessonId;
  export let path;
  let show = null;

  const { page } = stores();

  function handleMainGroupClick(href) {
    return () => {
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

  onMount(() => {
    show = localStorage.getItem('hideCourseNav') === 'false';

    hotkeys('b', function (event, handler) {
      event.preventDefault();
      switch (handler.key) {
        case 'b':
          show = !show;
          break;
      }
    });
  });

  // $: {
  //   if (process.browser && show !== null) {
  //     localStorage.setItem('hideCourseNav', `${!show}`);
  //   }
  // }

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
        label: 'Submissions',
        to: getNavItemRoute($course.id, 'submissions'),
        hideSortIcon: true,
      },
      {
        label: 'Scoreboard',
        to: getNavItemRoute($course.id, 'scoreboard'),
        hideSortIcon: true,
      },
      {
        label: 'People',
        to: getNavItemRoute($course.id, 'people'),
        hideSortIcon: true,
      },
      {
        label: 'Timetable',
        to: getNavItemRoute($course.id, 'timetable'),
        hideSortIcon: true,
      },
    ];
  }
</script>

<div class="root z-10 {!show && 'hide'}">
  {#if show}
    <PageNav
      bind:title={$course.title}
      onEditComplete={handleSaveTitle}
      isTitleEditable={true}
    />
    <div>
      {#each navItems as navItem}
        <Expandable
          label={navItem.label}
          handleClick={handleMainGroupClick(navItem.to)}
          isGroupActive={(path || $page.path) === navItem.to}
          hideSortIcon={navItem.hideSortIcon}
        >
          {#if navItem.isLecture}
            {#each $lessons as item, index}
              <a
                class="item flex items-center {(path || $page.path).includes(
                  item.id
                ) && 'active'} pl-7 py-2 {!item.is_complete &&
                  'cursor-not-allowed'}"
                href={getLessonsRoute($course.id, item.id)}
              >
                <span class="course-counter"> {getLectureNo(index + 1)} </span>
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
        </Expandable>
      {/each}
    </div>
  {/if}
  <div class="toggler absolute bottom-0 -right-0.5">
    <IconButton
      value="toggle"
      onClick={() => (show = !show)}
      toolTipProps={{
        title: 'Toggle sidebar',
        hotkeys: ['B'],
        direction: 'right',
      }}
    >
      {#if show}
        <ChevronLeft32 class="carbon-icon" />
      {:else}
        <ChevronRight32 class="carbon-icon" />
      {/if}
    </IconButton>
  </div>
</div>

<style lang="scss">
  .root {
    height: 93vh;
    display: flex;
    flex-direction: column;
    min-width: 360px;
    max-width: 360px;
    position: sticky;
    top: 0;
    border-right: 1px solid var(--border-color);

    &.hide {
      min-width: 0px;
      max-width: 0px;
    }
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

  .toggler {
    right: -58px;
    z-index: 10;
    border: 1px solid var(--border-color);
    border-top-right-radius: 20px;
    border-bottom-right-radius: 20px;
  }
</style>
