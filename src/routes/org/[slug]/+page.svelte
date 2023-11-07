<script lang="ts">
  import { profile } from '$lib/utils/store/user';
  // import { supabase } from '$lib/utils/functions/supabase';
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import UnlockedIcon from 'carbon-icons-svelte/lib/Unlocked.svelte';
  import LockedIcon from 'carbon-icons-svelte/lib/Locked.svelte';
  // import Avatar from '$lib/components/Avatar/index.svelte';
  import { InlineCalendar, Datepicker } from 'svelte-calendar';
  import { formatUserUpcomingData, formatDate } from '$lib/utils/functions/routes/dashboard';
  import { user } from '$lib/utils/store/user';
  import { fetchUserUpcomingData } from '$lib/utils/services/dashboard';
  import { isMobile } from '$lib/utils/store/useMobile';
  import type { UserLessonDataType, LessonsByMonthIndexType } from '$lib/utils/types';
  import WelcomeModal from '$lib/components/WelcomeModal/WelcomeModal.svelte';
  import { onMount } from 'svelte';
  import { Add } from 'carbon-icons-svelte';
  import { isOrgAdmin, currentOrgPath, currentOrg, userUpcomingData } from '$lib/utils/store/org';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants.js';
  import VisitOrgSiteButton from '$lib/components/Buttons/VisitOrgSite.svelte';
  import { getGreeting } from '$lib/utils/functions/date';
  import { appStore } from '$lib/utils/store/app';

  export let data;

  const { orgName } = data;

  let theme = {};

  let store;
  let calendar: HTMLElement | null = null;
  let lessonsByMonth: LessonsByMonthIndexType = {};
  let prevSelectedDate: string = new Date().toUTCString();
  let selectedDateLessonData: UserLessonDataType[] | [] = [];

  const boxes = [
    {
      label: 'Revenue (NGN)',
      value: '0.00'
    },
    {
      label: 'Number of sales',
      value: 0
    },
    {
      label: 'Number of courses',
      value: 0
    },
    {
      label: 'Total students',
      value: 0
    }
  ];

  function createCourse() {
    goto(`/org/${orgName}/courses?create=true`);
  }

  const addDotsToCalendar = (currentMonthIndexInRenderedMonth: number) =>
    setTimeout(() => {
      if (!calendar) calendar = document.getElementById('calendar');
      // console.log(
      //   `currentMonthIndexInRenderedMonth`,
      //   currentMonthIndexInRenderedMonth
      // );

      const renderedMonths =
        calendar?.querySelectorAll('.contents .container .stage .grid .grid') || [];
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
          dayElement.insertAdjacentHTML('beforeend', '<span class="active-day">•</span>');
        }
      }
    }, 500);

  async function runFirstThings(currentSession: { id: string } | null, orgId: string) {
    if (!currentSession || !currentSession.id || !orgId) return;

    if (!$userUpcomingData.length) {
      $userUpcomingData = await fetchUserUpcomingData(currentSession.id, orgId);
    }

    lessonsByMonth = formatUserUpcomingData($userUpcomingData);

    // Only for desktop. Only run on mobile when the user clicks on the date
    if (!$isMobile) {
      addDotsToCalendar(1);
    }
  }

  function getDataOfSelectedDate(_selectedDate: string, orgId: string): UserLessonDataType[] | [] {
    if (!_selectedDate) return [];

    const selectedDate = new Date(_selectedDate).toUTCString();

    const monthIndex = new Date(selectedDate).getMonth();
    const dateIndex = new Date(selectedDate).getDate();

    // If we changed the month, update the calendar dots
    const prevMonthIndex = new Date(prevSelectedDate).getMonth();
    if (prevMonthIndex !== monthIndex) {
      const currentMonthIndexInRenderedMonth = monthIndex < prevMonthIndex ? 1 : 2;

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
      $store.shouldEnlargeDay = false;
    }
  });

  // This is here not called onMount because we want to call it as soon as we have the user's `currentSession` value
  $: runFirstThings($user.currentSession, $currentOrg.id);

  // Every time the date changes
  $: selectedDateLessonData = getDataOfSelectedDate($store?.selected, $currentOrg.id);

  $: theme = {
    calendar: {
      width: '250px',
      height: '283px',
      shadow: '0px 0px 5px rgba(0, 0, 0, 0.25)',
      legend: {
        height: '30px'
      },
      colors: {
        text: {
          primary: $appStore.isDark ? '#eee' : '#333',
          highlight: '#fff'
        },
        background: {
          primary: $appStore.isDark ? '#333' : '#fff',
          highlight: $appStore.isDark ? '#5829d6' : '#eb7400',
          hover: $appStore.isDark ? '#222' : '#eee'
        },
        border: $appStore.isDark ? '#222' : '#eee'
      }
    }
  };
</script>

<svelte:head>
  <title>Dashboard - ClassroomIO</title>
</svelte:head>

<WelcomeModal />

<div class="py-10 px-5 w-full max-w-7xl mx-auto">
  <div class="flex items-center justify-between mb-10">
    <h1 class="dark:text-white text-2xl md:text-3xl font-bold mb-3">
      {getGreeting()}
      {$profile.fullname}!
    </h1>
    <div class="flex items-center">
      <PrimaryButton
        variant={VARIANTS.OUTLINED}
        onClick={createCourse}
        isDisabled={!$isOrgAdmin}
        className="min-h-[36px]"
      >
        {#if $isMobile}
          <Add size={24} />
        {:else}
          Create Course
        {/if}
      </PrimaryButton>

      <VisitOrgSiteButton />
    </div>
  </div>

  <div
    class="w-full h-fit lg:h-[265px] flex md:items-center justify-between flex-col-reverse md:flex-row p-5 lg:p-10 rounded-md bg-primary-900 my-2"
  >
    <span>
      <p class="w-full md:w-[75%] lg:w-[80%] text-white text-xs lg:text-xl font-normal mb-5">
        Thank you for what you do ❤️. You are changing lives one classroom at a time and thanks to
        you, the world is a better place. 😊
      </p>
      <PrimaryButton
        label="Keep Building 🚀"
        variant={VARIANTS.CONTAINED_WHITE}
        onClick={() => goto(`${$currentOrgPath}/courses`)}
      />
    </span>
    <img
      src="/images/student-learning.svg"
      alt="student Learning Pictogram"
      class="w-28 md:block md:w-1/3 lg:w-[200px] lg:max-h-[205px] mb-3 md:mb-0"
    />
  </div>

  <!-- <div class="flex items-start flex-wrap">
    {#each boxes as box}
      <div
        class="w-full md:w-[246px] h-[165px] flex flex-col rounded border border-gray-200 justify-center px-5 md:mr-5 mb-5"
      >
        <p class="dark:text-white mb-2 text-sm">{box.label}</p>
        <p class="dark:text-white text-xl font-bold">{box.value}</p>
      </div>
    {/each}
  </div> -->

  <div class="w-full">
    <!-- Your Schedule -->
    <div class="w-full xl:w-auto container">
      <p class="dark:text-white font-bold mt-7 mb-4">Your Schedule</p>
      <div
        class="rounded border border-gray-200 gap-3 flex flex-col md:flex-row items-start px-2 md:px-5 py-5 w-full"
      >
        {#if !$isMobile}
          <div id="calendar" class="flex justify-center mt-5 w-2/5 min-w-[250px]">
            <InlineCalendar bind:store {theme} />
          </div>
        {:else}
          <div class="header w-full flex items-center">
            <Datepicker bind:store let:key let:send let:receive>
              <button
                class="text-lg font-bold text-primary-700 p-3 hover:bg-gray-300 rounded-md"
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
        {/if}

        <div class="max-h-[400px] overflow-y-scroll w-full">
          {#if !$isMobile}
            <p class="dark:text-white font-bold m-5">
              {formatDate($store?.selected)}
            </p>
          {/if}
          {#each selectedDateLessonData as lessonData}
            <div class="flex items-center justify-between p-5 lesson-data">
              <div class="w-full">
                <a
                  class="text-black-700 text-lg font-bold flex items-center"
                  href={`/courses/${lessonData.course_id}/lessons/${
                    lessonData.is_unlocked ? lessonData.lesson_id : ''
                  }`}
                >
                  {lessonData.lesson_title}
                  {#if lessonData.is_unlocked}
                    <span class="ml-2 success">
                      <LockedIcon class="carbon-icon dark:text-white" />
                    </span>
                  {:else}
                    <UnlockedIcon class="carbon-icon dark:text-white" />
                  {/if}
                </a>
                <p class="dark:text-white text-grey text-sm flex items-center">
                  <a class="underline text-primary-700 my-2" href="/courses/{lessonData.course_id}">
                    {` ${lessonData.course_title}`}
                  </a>
                </p>
              </div>
              {#if lessonData.is_unlocked}
                <a
                  class="join-call rounded-3xl bg-primary-600 text-white py-3 font-bold shadow-lg {!lessonData.call_url &&
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
            <p class="dark:text-white flex items-center justify-center w-full no-data">
              No lesson on this day
            </p>
          {/each}
        </div>
      </div>
    </div>

    <!-- Your Activities -->

    <!-- <div class="w-full">
      <p class="dark:text-white font-bold mb-7">Your Activities</p>
      <div
        class="rounded border border-gray-200 md:min-w-[450px] activities-box py-4 px-2 md:px-5 w-full"
      >
        {#each activities as activity}
          <div class="flex mb-3 pb-3 border-b border-gray-200">
            <Avatar src={activity.avatar} name="avatar" />
            <div class="ml-2 flex flex-col xl:flex-row">
              <div class="mr-2">
                <p class="dark:text-white">{activity.name}</p>
                <p class="dark:text-white mb-2 mt-1 line-clamp-1">
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
    </div> -->
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

  :global(#calendar .controls .button.label) {
    font-size: 1rem;
  }

  @media (max-width: 640px) {
    :global(span.active-day) {
      font-size: 30px;
    }
  }
</style>
