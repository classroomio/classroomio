<script lang="ts">
  // @ts-nocheck

  import { onMount } from 'svelte';
  import '@carbon/charts-svelte/styles.css';
  import { BarChartSimple } from '@carbon/charts-svelte';
  import Report from 'carbon-icons-svelte/lib/Report.svelte';
  import Calendar from 'carbon-icons-svelte/lib/Calendar.svelte';
  import Notebook from 'carbon-icons-svelte/lib/Notebook.svelte';
  import RowExpand from 'carbon-icons-svelte/lib/RowExpand.svelte';
  import CheckmarkFilled from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  import PresentationFile from 'carbon-icons-svelte/lib/PresentationFile.svelte';

  import { fetchCourse, fetchCourses, getMarks } from '$lib/utils/services/courses/index.js';
  import { currentOrg } from '$lib/utils/store/org.js';
  import { course } from '$lib/components/Course/store.js';
  import { supabase } from '$lib/utils/functions/supabase.js';
  import formatDate from '$lib/utils/functions/formatDate.js';
  import type { StudentStat } from '$lib/utils/types/index.js';
  import { courseMetaDeta, courses } from '$lib/components/Courses/store';

  import Tabs from '$lib/components/Tabs/index.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import ActivateSectionsModal from '$lib/components/Course/components/Lesson/ActivateSectionsModal.svelte';
  import { Dropdown } from 'carbon-components-svelte';

  export let data;

  const {
    user,
    completedLessons,
    pendingLessons,
    totalExercises,
    grades,
    average,
    progressPercentage
  } = data?.data;

  $: console.log('request data', data);

  let tabs = [
    {
      label: 'PENDING',
      value: 'PENDING'
    },
    {
      label: 'COMPLETED',
      value: 'COMPLETED'
    }
  ];

  let currentTab = tabs[0].value;
  let hasFetched = false;
  let learningActivities = [];
  let allCourses: any[] = [];
  let selectedId = '';

  const getValue = (label: string) => {
    const tabValue = tabs.find((tab) => tab.label === label)?.value;
    return tabValue;
  };

  const onChange = (tab) => {
    return () => {
      currentTab = tab;
    };
  };

  function timeAgo(timestamp: string) {
    const now = new Date();
    const time = new Date(timestamp);

    const diffInMs = now.getTime() - time.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60)); // Convert milliseconds to hours

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60)); // Convert milliseconds to minutes
      return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        -diffInMinutes,
        'minute'
      );
    } else if (diffInHours < 24) {
      return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-diffInHours, 'hour');
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-diffInDays, 'day');
    }
  }

  function getPercentage(a, b) {
    if (b === 0) {
      return 0;
    }
    return Math.round((a / b) * 100);
  }

  $: inputRange = completedLessons?.length / pendingLessons?.length + completedLessons?.length;
  $: learningActivities = [
    {
      icon: Notebook,
      totalLesson: pendingLessons?.length + completedLessons?.length,
      completedLesson: completedLessons?.length,
      title: 'Lesson completed'
    },
    {
      icon: Report,
      totalLesson: totalExercises,
      completedLesson: grades?.length,
      title: 'Pending Exercises'
    },
    {
      icon: RowExpand,
      totalLesson: `${Math.round(average)}%`,
      title: 'Average Grade'
    }
  ];
</script>

<CourseContainer containerClass="px-7">
  <div class="mt-5 h-[90vh] overflow-y-auto">
    <!-- first section -->
    <div class="flex items-start md:items-center flex-col md:flex-row gap-5 mt-5">
      <!-- user details -->
      <div
        class="flex flex-col gap-3 items-start md:items-center border border-[#DEDEDE] rounded-md py-4 px-5 w-full md:w-[35%]"
      >
        <div class="w-full px-3 flex justify-center gap-4 items-center">
          <img src="/images/user-placeholder.svg" alt="" class="rounded-full w-[20%] md:w-[30%]" />

          <div>
            <h1 class="m-0 text-lg leading-4">{user?.fullName}</h1>
            <span class="text-xs m-0">Student</span>
          </div>
        </div>

        <p
          class="text-xs uppercase font-medium mt-1 py-1.5 text-center w-full bg-primary-600 text-white rounded-sm"
        >
          Last seen: {user?.lastSeen && timeAgo(user?.lastSeen)} ago
        </p>
      </div>

      <!-- course progress -->
      <div class="w-[65%]">
        <h3 class="text-sm font-semibold m-0">Course Progress</h3>

        <div
          class="flex justify-between items-center border border-[#DEDEDE] rounded-md mt-2 py-2 px-3"
        >
          <img src="/images/target.svg" alt="" class="rounded-full w-[13%]" />

          <div class="leading-5">
            <p class="text-sm font-semibold">
              {completedLessons?.length}/{pendingLessons?.length + completedLessons?.length} lessons
              completed
            </p>

            <input
              disabled
              type="range"
              min="0"
              max="100"
              bind:value={inputRange}
              class="range-input"
              style="background: linear-gradient(to right, #0233BD {completedLessons?.length}%, #ccc {completedLessons?.length}%);"
            />
          </div>

          <h1 class="text-4xl font-bold">{progressPercentage}%</h1>
        </div>
      </div>
    </div>

    <!-- learning activities (second section) -->
    <div class="mt-10">
      <h3>Metrics</h3>

      <div class="w-full flex items-center justify-between">
        {#each learningActivities as activity}
          <div
            class="bg-[#F7F7F7] p-5 border-b-2 rounded-b-sm border-[#0233BD] flex gap-5 justify-center items-center w-[30%]"
          >
            <div class="w-fit p-4 rounded-full bg-blue-500/25">
              <svelte:component this={activity.icon} size={24} color="blue" />
            </div>

            <div>
              {#if activity.completedLesson !== undefined}
                <h3 class="m-0 leading-7">{activity.completedLesson}/{activity.totalLesson}</h3>
              {:else}
                <h3 class="m-0 leading-7">{activity.totalLesson}</h3>
              {/if}
              <p class="text-sm leading-3">{activity.title}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- lessons and activities (third section) -->
    <div class="flex justify-between my-10">
      <!-- lessons -->
      <div class="w-[48%]">
        <h3 class="m-0">Lessons</h3>

        <Tabs {tabs} bind:currentTab {onChange}>
          <slot:fragment slot="content">
            <TabContent value={getValue('PENDING')} index={currentTab}>
              <div class="flex flex-col gap-3 -mt-5 max-h-[45vh] overflow-y-scroll">
                {#if pendingLessons?.length > 0}
                  {#each pendingLessons as pending}
                    <div class="border border-[#DEDEDE] rounded-sm p-4 flex flex-col gap-4">
                      <h3 class="m-0 leading-4 font-semibold">{pending.title}</h3>

                      <div class="flex justify-between items-center">
                        <div class="flex items-center gap-1.5 text-xs">
                          <Calendar size={16} />
                          {formatDate(pending.created_at)}
                        </div>

                        <div class="flex items-center gap-1.5 text-xs">
                          <PresentationFile size={16} />
                          {pending.exerciseNo} Exercise(s)
                        </div>
                      </div>
                    </div>
                  {/each}
                {:else}
                  <p class="text-sm text-center">No Pending Course Found</p>
                {/if}
              </div>
            </TabContent>

            <TabContent value={getValue('COMPLETED')} index={currentTab}>
              <div class="flex flex-col gap-3 -mt-5 max-h-[45vh] overflow-y-scroll">
                {#if completedLessons?.length > 0}
                  {#each completedLessons as pending}
                    <div class="border border-[#DEDEDE] rounded-sm p-4 flex flex-col gap-4">
                      <h3 class="m-0 leading-4 font-semibold">{pending.title}</h3>

                      <div class="flex justify-between items-center">
                        <div class="flex items-center gap-1.5 text-xs">
                          <Calendar size={16} />
                          {formatDate(pending.created_at)}
                        </div>

                        <div class="flex items-center gap-1.5 text-xs">
                          <PresentationFile size={16} />
                          {pending.exerciseNo} Exercises
                        </div>
                      </div>
                    </div>
                  {/each}
                {:else}
                  <p class="text-sm text-center">No Completed Course</p>
                {/if}
              </div>
            </TabContent>
          </slot:fragment>
        </Tabs>
      </div>

      <!-- activities -->
      <div class="w-[48%]">
        <h3>Grades</h3>

        <div
          class="max-h-[50vh] h-full overflow-y-scroll flex items-center flex-col gap-3 p-3 border rounded-md"
        >
          {#if grades?.length > 0}
            {#each grades as grade}
              <div class="w-full bg-[#F7F7F7] border-[#EAEAEA] rounded-md p-3">
                <p class="text-sm font-medium">{grade.title}</p>

                <div class="flex justify-between items-center mt-2 text-sm">
                  <span class="text-[#656565] flex item-center gap-3"
                    ><CheckmarkFilled
                      color={grade.grade >= 70 ? 'green' : grade.grade >= 30 ? 'orange' : 'red'}
                      size={20}
                    />

                    Grade:</span
                  >

                  <span class="font-semibold">{getPercentage(grade.grade, grade.totalPoints)}%</span
                  >
                </div>
              </div>
            {/each}
          {:else}
            <p class="text-sm text-center">No Exercise Completed</p>
          {/if}
        </div>
      </div>
    </div>
  </div>
</CourseContainer>

<style>
  .range-input {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    outline: none;
    border-radius: 15px;
    height: 0.5rem;
  }

  .range-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
  }
</style>
