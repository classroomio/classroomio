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
  import ActivateSectionsModal from '$lib/components/Course/components/Lesson/ActivateSectionsModal.svelte';
  import { Dropdown } from 'carbon-components-svelte';

  export let data;

  const { user, completedCourses, pendingCourses, metrics } = data?.data;

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
  let userMetrics = [];
  let allCourses: any[] = [];
  let courseProgressRange = 0;

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

  $: courseProgressRange = Math.round(
    (completedCourses?.length / (completedCourses?.length + pendingCourses?.length)) * 100
  );

  $: userMetrics = [
    {
      icon: Notebook,
      total: pendingCourses?.length + completedCourses?.length,
      completed: completedCourses?.length,
      title: 'Total Course Completed'
    },
    {
      icon: Report,
      total: metrics.exercise.total,
      completed: metrics.exercise.completed,
      title: 'Total Pending Exercises'
    },
    {
      icon: RowExpand,
      total: `${Math.round(metrics.exercise.averageGrade)}%`,
      title: 'Total Average Grade'
    }
  ];
</script>

<div class="max-w-[90%] mx-auto mt-5 h-[90vh] overflow-y-auto">
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
            {completedCourses?.length}/{pendingCourses?.length + completedCourses?.length} courses completed
          </p>

          <input
            disabled
            type="range"
            min="0"
            max="100"
            bind:value={courseProgressRange}
            class="range-input"
            style="background: linear-gradient(to right, #0233BD {courseProgressRange}%, #ccc {courseProgressRange}%);"
          />
        </div>

        <h1 class="text-4xl font-bold">{courseProgressRange}%</h1>
      </div>
    </div>
  </div>

  <!-- lessons and activities (third section) -->
  <div class="flex justify-between my-10">
    <!-- lessons -->
    <div class="w-full">
      <h3 class="m-0">Courses</h3>

      <Tabs {tabs} bind:currentTab {onChange}>
        <slot:fragment slot="content">
          <TabContent value={getValue('PENDING')} index={currentTab}>
            <div class="flex flex-wrap justify-between -mt-5 max-h-[45vh] overflow-y-scroll">
              {#if pendingCourses?.length > 0}
                {#each pendingCourses as pending}
                  <div class="border border-[#DEDEDE] rounded-sm p-4 flex flex-col gap-4 w-[49%]">
                    <div class="flex items-center gap-2 overflow-hidden">
                      <img
                        src={pending.logo !== ''
                          ? pending.logo
                          : '/images/classroomio-course-img-template.jpg'}
                        alt=""
                        class="w-14"
                      />
                      <div>
                        <h3 class="m-0 font-semibold">{pending.title}</h3>
                        <p class="m-0 text-xs truncate w-[60%]">{pending.description}</p>
                      </div>
                    </div>

                    <div class="flex justify-between items-center">
                      <input
                        disabled
                        type="range"
                        min="0"
                        max="100"
                        bind:value={pending.courseProgress}
                        class="range-input"
                        style="background: linear-gradient(to right, #0233BD {pending.courseProgress}%, #ccc {pending.courseProgress}%);"
                      />
                    </div>
                  </div>
                {/each}
              {:else}
                <p class="text-sm text-center">No Pending Course Found</p>
              {/if}
            </div>
          </TabContent>

          <TabContent value={getValue('COMPLETED')} index={currentTab}>
            <div class="flex flex-wrap justify-between -mt-5 max-h-[45vh] overflow-y-scroll">
              {#if completedCourses?.length > 0}
                {#each completedCourses as completed}
                  <div class="border border-[#DEDEDE] rounded-sm p-4 flex flex-col gap-4 w-[49%]">
                    <div class="flex items-center gap-2 overflow-hidden">
                      <img
                        src={completed.logo !== ''
                          ? completed.logo
                          : '/images/classroomio-course-img-template.jpg'}
                        alt=""
                        class="w-10"
                      />
                      <div>
                        <h3 class="m-0 font-semibold">{completed.title}</h3>
                        <p class="m-0 text-xs truncate">{completed.description}</p>
                      </div>
                    </div>

                    <div class="flex justify-between items-center">
                      <input
                        disabled
                        type="range"
                        min="0"
                        max="100"
                        bind:value={completed.courseProgress}
                        class="range-input"
                        style="background: linear-gradient(to right, #0233BD {completed.courseProgress}%, #ccc {completed.courseProgress}%);"
                      />
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
  </div>

  <!-- Metrics (third section) -->
  <div class="mt-10">
    <h3>Metrics</h3>

    <div class="w-full flex items-center justify-between">
      {#each userMetrics as metric}
        <div
          class="bg-[#F7F7F7] p-5 border-b-2 rounded-b-sm border-[#0233BD] flex gap-5 justify-center items-center w-[30%]"
        >
          <div class="w-fit p-4 rounded-full bg-blue-500/25">
            <svelte:component this={metric.icon} size={24} color="blue" />
          </div>

          <div>
            {#if metric.completed !== undefined}
              <h3 class="m-0 leading-7">{metric.completed}/{metric.total}</h3>
            {:else}
              <h3 class="m-0 leading-7">{metric.total}</h3>
            {/if}
            <p class="text-sm leading-3">{metric.title}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

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
