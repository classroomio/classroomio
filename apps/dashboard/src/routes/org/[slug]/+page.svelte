<script lang="ts">
  import { goto } from '$app/navigation';
  import { profile } from '$lib/utils/store/user';
  import { Add } from 'carbon-icons-svelte';
  import LockedIcon from 'carbon-icons-svelte/lib/Locked.svelte';
  import UnlockedIcon from 'carbon-icons-svelte/lib/Unlocked.svelte';
  import { onMount } from 'svelte';
  import { Datepicker, InlineCalendar } from 'svelte-calendar';
  // import { supabase } from '$lib/utils/functions/supabase';
  // import Avatar from '$lib/components/Avatar/index.svelte';
  import VisitOrgSiteButton from '$lib/components/Buttons/VisitOrgSite.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import WelcomeModal from '$lib/components/WelcomeModal/WelcomeModal.svelte';
  import { getGreeting } from '$lib/utils/functions/date';
  import { formatDate, formatUserUpcomingData } from '$lib/utils/functions/routes/dashboard';
  import { t } from '$lib/utils/functions/translations';
  import { fetchUserUpcomingData } from '$lib/utils/services/dashboard';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg, currentOrgPath, isOrgAdmin, userUpcomingData } from '$lib/utils/store/org';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { user } from '$lib/utils/store/user';
  import type { LessonsByMonthIndexType, UserLessonDataType } from '$lib/utils/types';

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
          primary: $globalStore.isDark ? '#eee' : '#333',
          highlight: '#fff'
        },
        background: {
          primary: $globalStore.isDark ? '#333' : '#fff',
          highlight: $globalStore.isDark ? '#5829d6' : '#eb7400',
          hover: $globalStore.isDark ? '#222' : '#eee'
        },
        border: $globalStore.isDark ? '#222' : '#eee'
      }
    }
  };
</script>

<svelte:head>
  <title>Dashboard - ClassroomIO</title>
</svelte:head>

<WelcomeModal />

<div class="w-full max-w-5xl px-5 py-10 md:mx-auto">
  <div class="mb-10 flex items-center justify-between">
    <h1 class="mb-3 text-2xl font-bold dark:text-white md:text-3xl">
      {$t(getGreeting())}
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
          {$t('dashboard.create_course')}
        {/if}
      </PrimaryButton>

      <VisitOrgSiteButton />
    </div>
  </div>

  <div
    class="bg-primary-900 my-2 flex h-fit w-full flex-col-reverse justify-between rounded-md p-5 md:flex-row md:items-center lg:h-[265px] lg:p-10"
  >
    <span>
      <p class="mb-5 w-full text-xs font-normal text-white md:w-[75%] lg:w-[80%] lg:text-xl">
        {$t('dashboard.hero_content')}
      </p>
      <PrimaryButton
        label={$t('dashboard.hero_button')}
        variant={VARIANTS.CONTAINED_WHITE}
        onClick={() => goto(`${$currentOrgPath}/courses`)}
      />
    </span>
    <img
      src="/images/student-learning.svg"
      alt="student Learning Pictogram"
      class="mb-3 w-28 md:mb-0 md:block md:w-1/3 lg:max-h-[205px] lg:w-[200px]"
    />
  </div>

  <!-- <div class="flex items-start flex-wrap">
    {#each boxes as box}
      <div
        class="w-full md:w-[246px] h-[165px] flex flex-col rounded border border-gray-200 dark:border-neutral-600 justify-center px-5 md:mr-5 mb-5"
      >
        <p class="dark:text-white mb-2 text-sm">{box.label}</p>
        <p class="dark:text-white text-xl font-bold">{box.value}</p>
      </div>
    {/each}
  </div> -->

  <div class="w-full">
    <!-- Your Schedule -->
    <div class="container w-full xl:w-auto">
      <p class="mb-4 mt-7 font-bold dark:text-white">{$t('dashboard.your_schedule')}</p>
      <div
        class="flex w-full flex-col items-start gap-3 rounded border border-gray-200 px-2 py-5 dark:border-neutral-600 md:flex-row md:px-5"
      >
        {#if !$isMobile}
          <div id="calendar" class="mt-5 flex w-2/5 min-w-[250px] justify-center">
            <InlineCalendar bind:store {theme} />
          </div>
        {:else}
          <div class="header flex w-full items-center">
            <Datepicker bind:store let:key let:send let:receive>
              <button
                class="text-primary-700 rounded-md p-3 text-lg font-bold hover:bg-gray-300"
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

        <div class="max-h-[400px] w-full overflow-y-scroll">
          {#if !$isMobile}
            <p class="m-5 font-bold dark:text-white">
              {formatDate($store?.selected)}
            </p>
          {/if}
          {#each selectedDateLessonData as lessonData}
            <div class="lesson-data flex items-center justify-between p-5">
              <div class="w-full">
                <a
                  class="text-black-700 flex items-center text-lg font-bold"
                  href={`/courses/${lessonData.course_id}/lessons/${
                    lessonData.is_unlocked ? lessonData.lesson_id : ''
                  }`}
                >
                  {lessonData.lesson_title}
                  {#if lessonData.is_unlocked}
                    <span class="success ml-2">
                      <LockedIcon class="carbon-icon dark:text-white" />
                    </span>
                  {:else}
                    <UnlockedIcon class="carbon-icon dark:text-white" />
                  {/if}
                </a>
                <p class="text-grey flex items-center text-sm dark:text-white">
                  <a class="text-primary-700 my-2 underline" href="/courses/{lessonData.course_id}">
                    {` ${lessonData.course_title}`}
                  </a>
                </p>
              </div>
              {#if lessonData.is_unlocked}
                <a
                  class="join-call bg-primary-600 rounded-3xl py-3 font-bold text-white shadow-lg {!lessonData.call_url &&
                    'pointer-events-none cursor-not-allowed opacity-50'}"
                  href={!!lessonData.call_url ? lessonData.call_url : undefined}
                  target="_blank"
                  title={!!lessonData.call_url
                    ? $t('dashboard.click_to_join')
                    : $t('dashboard.no_call_link')}
                >
                  {$t('dashboard.join_call')}
                </a>
              {/if}
            </div>
          {:else}
            <p class="dark:text-white flex items-center justify-center w-full no-data">
              {$t('dashboard.no_schedule')}
            </p>
          {/each}
        </div>
      </div>
    </div>

    <!-- Your Activities -->

    <!-- <div class="w-full">
      <p class="dark:text-white font-bold mb-7">Your Activities</p>
      <div
        class="rounded border border-gray-200 dark:border-neutral-600 md:min-w-[450px] activities-box py-4 px-2 md:px-5 w-full"
      >
        {#each activities as activity}
          <div class="flex mb-3 pb-3 border-b border-gray-200 dark:border-neutral-600">
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
