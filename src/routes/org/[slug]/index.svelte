<script context="module">
  export async function preload({ params }) {
    return {
      orgName: params.slug,
    };
  }
</script>

<script lang="ts">
  // import { profile } from '../../utils/store/user';
  // import { supabase } from '../../utils/functions/supabase';
  import { goto } from '@sapper/app';
  import PrimaryButton from '../../../components/PrimaryButton/index.svelte';
  import Avatar from '../../../components/Avatar/index.svelte';
  import { InlineCalendar, Datepicker } from 'svelte-calendar';
  import CheckmarkFilled20 from 'carbon-icons-svelte/lib/CheckmarkFilled20';
  import {
    formatUserUpcomingData,
    formatDate,
  } from '../../../utils/functions/routes/dashboard';
  import { user } from '../../../utils/store/user';
  import { fetchUserUpcomingData } from '../../../utils/services/dashboard';
  import { isMobile } from '../../../utils/store/useMobile';
  import type {
    UserLessonDataType,
    LessonsByMonthIndexType,
  } from '../../../utils/types';
  import WelcomeModal from '../../../components/WelcomeModal/WelcomeModal.svelte';
  import { onMount } from 'svelte';

  export let orgName: string;

  function createCourse() {
    goto(`/org/${orgName}/courses?create=true`);
  }

  const theme = {
    calendar: {
      width: '300px',
      height: '300px',
      shadow: '0px 0px 5px rgba(0, 0, 0, 0.25)',
    },
  };

  let store;
  let calendar: HTMLElement | null = null;
  let lessonsByMonth: LessonsByMonthIndexType = {};
  let prevSelectedDate: string = new Date().toUTCString();
  let selectedDateLessonData: UserLessonDataType[] | [] = [];

  const boxes = [
    {
      label: 'Revenue (NGN)',
      value: '0.00',
    },
    {
      label: 'Number of sales',
      value: 0,
    },
    {
      label: 'Number of courses',
      value: 0,
    },
    {
      label: 'Total students',
      value: 0,
    },
  ];
  const activities = [
    {
      avatar:
        'https://lh3.googleusercontent.com/ogw/AOh-ky0MLuNJZQa6E_6mm3eZtLW2dmTIhriSgzQlRLA9=s64-c-mo',
      name: 'Nnancy Okoye',
      time: '1 hour ago',
      description: 'Submitted an assignment for lesson Figma prototyping',
      link: '/',
    },
    {
      avatar:
        'https://lh3.googleusercontent.com/ogw/AOh-ky0MLuNJZQa6E_6mm3eZtLW2dmTIhriSgzQlRLA9=s64-c-mo',
      name: 'Bro Shagi',
      time: '2 days ago',
      description: 'Submitted an assignment for lesson Figma prototyping',
      link: '/',
    },
    {
      avatar:
        'https://lh3.googleusercontent.com/ogw/AOh-ky0MLuNJZQa6E_6mm3eZtLW2dmTIhriSgzQlRLA9=s64-c-mo',
      name: 'Bill Gates',
      time: '13 hours ago',
      description: 'Submitted an assignment for lesson Figma prototyping',
      link: '/',
    },
    {
      avatar:
        'https://lh3.googleusercontent.com/ogw/AOh-ky0MLuNJZQa6E_6mm3eZtLW2dmTIhriSgzQlRLA9=s64-c-mo',
      name: 'Steve Jobs',
      time: 'yesterday',
      description: 'Submitted an assignment for lesson Figma prototyping',
      link: '/',
    },
  ];

  const addDotsToCalendar = (currentMonthIndexInRenderedMonth: number) =>
    setTimeout(() => {
      if (!calendar) calendar = document.getElementById('calendar');
      // console.log(
      //   `currentMonthIndexInRenderedMonth`,
      //   currentMonthIndexInRenderedMonth
      // );

      const renderedMonths =
        calendar?.querySelectorAll('.contents .container .stage .grid .grid') ||
        [];
      // console.log(`renderedMonths`, renderedMonths);
      const currentMonthIndex = new Date($store?.selected).getMonth();
      const currentMonth = renderedMonths[currentMonthIndexInRenderedMonth];
      // console.log(`currentMonth`, currentMonth);
      // All elements for each day in the month - with prev or next month
      const currentMonthElements =
        currentMonth?.querySelectorAll<HTMLElement>('a:not(.outsider)') || [];
      // console.log(`currentMonthElements`, currentMonthElements, '\n\n');
      const currentMonthData = lessonsByMonth[currentMonthIndex];
      if (!currentMonthData) return;

      for (let i in currentMonthElements) {
        if (!currentMonthElements.hasOwnProperty(i)) {
          continue;
        }

        const dayElement = currentMonthElements[i];
        dayElement.style.position = 'relative';

        // The date is inside the element like <a>2</a>
        const dateIndex = Number(dayElement.innerHTML);
        if (!!currentMonthData[dateIndex]) {
          // console.log(`dateIndex`, dateIndex);
          // console.log(`lesson data`, currentMonthData[dateIndex]);
          dayElement.insertAdjacentHTML(
            'beforeend',
            '<span class="active-day">•</span>'
          );
        }
      }
    }, 500);

  async function runFirstThings(currentSession: { id: string } | null) {
    if (!currentSession || !currentSession.id) return;

    const userUpcomingData = await fetchUserUpcomingData(currentSession.id);

    lessonsByMonth = formatUserUpcomingData(userUpcomingData);

    // Only for desktop. Only run on mobile when the user clicks on the date
    if (!$isMobile) {
      addDotsToCalendar(1);
    }
  }

  function getDataOfSelectedDate(
    _selectedDate: string
  ): UserLessonDataType[] | [] {
    if (!_selectedDate) return [];

    const selectedDate = new Date(_selectedDate).toUTCString();

    const monthIndex = new Date(selectedDate).getMonth();
    const dateIndex = new Date(selectedDate).getDate();

    // If we changed the month, update the calendar dots
    const prevMonthIndex = new Date(prevSelectedDate).getMonth();
    if (prevMonthIndex !== monthIndex) {
      const currentMonthIndexInRenderedMonth =
        monthIndex < prevMonthIndex ? 1 : 2;

      addDotsToCalendar(currentMonthIndexInRenderedMonth);
    }

    prevSelectedDate = selectedDate;

    const monthLessonData = lessonsByMonth[monthIndex];
    if (!monthLessonData) {
      return [];
    }

    const dateLessonData = monthLessonData[dateIndex];
    if (!dateLessonData) {
      return [];
    }

    return dateLessonData;
  }

  onMount(() => {
    // Remove default shouldEnlargeDay=true when <DatePicker /> on mobile
    if ($store && $store.shouldEnlargeDay) {
      $store.shouldEnlargeDay = false
    }
  });

  // This is here not called onMount because we want to call it as soon as we have the user's `currentSession` value
  $: runFirstThings($user.currentSession);

  // Every time the date changes
  $: selectedDateLessonData = getDataOfSelectedDate($store?.selected);
</script>

<svelte:head>
  <title>Dashboard - ClassroomIO</title>
</svelte:head>

<WelcomeModal />

<div class="py-10 px-5 w-full max-w-7xl mx-auto">
  <div class="flex items-center justify-between mb-10">
    <h1 class="dark:text-white text-3xl font-bold">Dashboard</h1>
    <PrimaryButton label="Create Course" onClick={createCourse} />
  </div>

  <div class="flex items-start flex-wrap">
    {#each boxes as box}
      <div
        class="box flex flex-col rounded border border-gray-200 justify-center px-5 mr-5 mb-5"
      >
        <p class="dark:text-white mb-2 text-sm">{box.label}</p>
        <p class="dark:text-white text-xl font-bold">{box.value}</p>
      </div>
    {/each}
  </div>

  <div class="flex flex-wrap">
    <!-- Your Schedule -->
    <div>
      <p class="dark:text-white font-bold mb-7">Your Schedule</p>
      <div class="rounded border w-2/5 border-gray-200 mr-5 schedule-box">
        {#if !$isMobile}
          <div id="calendar" class="flex justify-center mt-5">
            <InlineCalendar bind:store {theme} />
          </div>
        {/if}

        {#if $isMobile}
          <div class="header w-full flex items-center">
            <Datepicker bind:store let:key let:send let:receive>
              <button
                class="text-lg font-bold text-blue-700 p-3 hover:bg-gray-300 rounded-md"
                in:receive|local={{ key }}
                out:send|local={{ key }}
                on:click={() => {
                  addDotsToCalendar(1);
                }}
              >
                {formatDate($store?.selected)}
              </button>
            </Datepicker>
          </div>
        {:else}
          <p class="dark:text-white font-bold m-5">
            {formatDate($store?.selected)}
          </p>
        {/if}

        {#each selectedDateLessonData as lessonData}
          <div class="flex items-center justify-between p-5 lesson-data">
            <div class="w-4/5">
              <a
                class="text-black-700 text-lg font-bold flex items-center"
                href={`/courses/${lessonData.course_id}/lessons/${
                  lessonData.is_complete ? lessonData.lesson_id : ''
                }`}
              >
                {lessonData.lesson_title}
                {#if lessonData.is_complete}
                  <span class="ml-2 success">
                    <CheckmarkFilled20 class="carbon-icon" />
                  </span>
                {:else}
                  <span class="text-md ml-2">🔒</span>
                {/if}
              </a>
              <p class="dark:text-white text-grey text-sm flex items-center">
                <a
                  class="underline text-blue-700 my-2"
                  href="/courses/{lessonData.course_id}"
                >
                  {` ${lessonData.course_title}`}
                </a>
              </p>
            </div>
            {#if lessonData.is_complete}
              <a
                class="join-call rounded-3xl bg-blue-600 text-white py-3 font-bold shadow-lg {!lessonData.call_url &&
                  'opacity-50 pointer-events-none cursor-not-allowed'}"
                href={!!lessonData.call_url ? lessonData.call_url : undefined}
                target="_blank"
                title={!!lessonData.call_url
                  ? 'Click to join the call'
                  : 'No call link was added for this lesson. Ask your trainer'}
              >
                Join call
              </a>
            {/if}
          </div>
        {:else}
          <p
            class="dark:text-white flex items-center justify-center w-full no-data"
          >
            No lesson on this day
          </p>
        {/each}
      </div>
    </div>

    <!-- Your Activities -->
    <div>
      <p class="dark:text-white font-bold mb-7">Your Activities</p>
      <div class="rounded border border-gray-200 w-5 activities-box py-4 px-5">
        {#each activities as activity}
          <div class="flex mb-3 pb-3 border-b border-gray-200">
            <Avatar src={activity.avatar} name="avatar" />
            <div class="ml-2 flex">
              <div class="mr-2">
                <p class="dark:text-white">{activity.name}</p>
                <p class="dark:text-white mb-2 mt-1">
                  {activity.description}
                </p>
                <a href={activity.link}>View</a>
              </div>

              <div>
                <p class="dark:text-white">{activity.time}</p>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .root {
    min-height: 93vh;
  }

  .box {
    width: 246px;
    height: 165px;
  }
  .schedule-box,
  .activities-box {
    min-width: 450px;
    height: 516px;
    overflow-y: auto;
  }

  .calendar-root {
    max-width: 1000px;
    margin: 0 auto;
  }

  .calendar-info {
    max-width: 600px;
    width: 100%;
    height: 100%;
  }

  .header {
    border-bottom: 1px solid var(--border-color);
    min-height: 61px;
  }

  .lesson-data {
    border-bottom: 1px solid var(--border-color);
  }

  .no-data {
    height: 100px;
  }

  .join-call {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    max-height: 48px;
    width: 110px;
    text-align: center;
  }

  :global(span.active-day) {
    position: absolute;
    bottom: -8px;
    left: 40%;
    color: var(--main-primary-color);
  }

  @media (max-width: 640px) {
    :global(span.active-day) {
      font-size: 30px;
    }
  }
</style>