<script lang="ts">
  // @ts-nocheck

  import '@carbon/charts-svelte/styles.css';
  import { BarChartSimple } from '@carbon/charts-svelte';
  import Report from 'carbon-icons-svelte/lib/Report.svelte';
  import Calendar from 'carbon-icons-svelte/lib/Calendar.svelte';
  import Notebook from 'carbon-icons-svelte/lib/Notebook.svelte';
  import Settings from 'carbon-icons-svelte/lib/Settings.svelte';
  import RowExpand from 'carbon-icons-svelte/lib/RowExpand.svelte';
  import PresentationFile from 'carbon-icons-svelte/lib/PresentationFile.svelte';

  import { courseMetaDeta, courses } from '$lib/components/Courses/store';

  import Tabs from '$lib/components/Tabs/index.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import ActivateSectionsModal from '$lib/components/Course/components/Lesson/ActivateSectionsModal.svelte';
  import { currentOrg } from '$lib/utils/store/org.js';
  import { fetchCourses } from '$lib/utils/services/courses/index.js';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/utils/functions/supabase.js';
  import type { StudentStat } from '$lib/utils/types/index.js';

  export let data;

  const { profileId } = data;

  export let user: StudentStat = {};

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

  const chartData = [
    {
      group: 'Monday',
      value: 5
    },
    {
      group: 'Tuesday',
      value: 10
    },
    {
      group: 'Wednesday',
      value: 0
    },
    {
      group: 'Thursday',
      value: 1
    },
    {
      group: 'Friday',
      value: 4
    },
    {
      group: 'Saturday',
      value: 7
    },
    {
      group: 'Sunday',
      value: 9
    }
  ];

  const options = {
    title: '-',
    axes: {
      left: {
        mapsTo: 'value'
      },
      bottom: {
        mapsTo: 'group',
        scaleType: 'labels'
      }
    },
    animations: true,
    height: '400px',
    accessibility: {
      svgAriaLabel: 'Simple bar chart'
    }
  };

  const getValue = (label: string) => {
    const tabValue = tabs.find((tab) => tab.label === label)?.value;
    return tabValue;
  };

  const onChange = (tab) => {
    return () => {
      currentTab = tab;
    };
  };

  async function getCourses(userId: string | undefined, orgId: string) {
    if (hasFetched || !userId || !orgId) {
      return;
    }
    // only show is loading when fetching for the first time
    if (!$courses.length) {
      $courseMetaDeta.isLoading = true;
    }

    const coursesResult = await fetchCourses(userId, orgId);
    console.log(`coursesResult`, coursesResult);

    $courseMetaDeta.isLoading = false;
    if (!coursesResult) return;
    const userCourses = coursesResult.allCourses;
    user.pendingCourses = userCourses.filter((course) => course.progress_rate < 100);
    user.completedCourses = userCourses.filter((course) => course.progress_rate === 100);
    hasFetched = true;
  }

  function calcTotalProgress(courses: Course[]) {
    user.totalCompleted = courses.reduce((acc, cur) => acc + (cur.progress_rate || 0), 0);
    user.totalLessons = courses.reduce((acc, cur) => acc + (cur.total_lessons || 0), 0);

    user.progressPercentage = Math.round((user.totalCompleted / user.totalLessons) * 100) || 0;
  }

  async function fetchUser(userId: string | undefined) {
    if (!userId) return;
    const result = await supabase.from('profile').select(`*`).eq('id', userId).single();
    console.log('result', result.data);
    user.username = result.data.fullname;
  }

  $: getCourses(profileId, $currentOrg.id);
  $: calcTotalProgress($courses);

  $: learningActivities = [
    {
      icon: Notebook,
      totalLesson: user.totalLessons,
      completedLesson: user.totalCompleted,
      title: 'Lesson completed'
    },
    {
      icon: Report,
      totalLesson: 12,
      completedLesson: 5,
      title: 'Exercise graded'
    },
    {
      icon: RowExpand,
      totalLesson: 24,
      title: 'Total LMS Entry'
    }
  ];

  onMount(() => {
    fetchUser(profileId);
  });
</script>

<CourseContainer containerClass="px-7">
  <div class="mt-5 h-[90vh] overflow-y-auto">
    <Settings size={20} />

    <!-- first section -->
    <div class="flex items-center gap-5 mt-5">
      <!-- user details -->
      <div
        class="flex flex-col gap-3 items-center border border-[#DEDEDE] rounded-md py-4 px-5 w-[35%]"
      >
        <div class="w-full px-3 flex justify-center gap-4 items-center">
          <img src="/images/user-placeholder.svg" alt="" class="rounded-full w-[30%]" />

          <div>
            <h1 class="m-0 text-lg leading-4">{user.username}</h1>
            <span class="text-xs m-0">Student</span>
          </div>
        </div>

        <p
          class="text-xs uppercase font-medium mt-1 py-1.5 text-center w-full bg-primary-600 text-white rounded-sm"
        >
          Last seen: 2hr ago
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
              {user.totalCompleted}/{user.totalLessons} lessons completed
            </p>

            <input
              disabled
              type="range"
              min="0"
              max="100"
              bind:value={user.progressPercentage}
              class="range-input"
              style="background: linear-gradient(to right, #0233BD {user.progressPercentage}%, #ccc {user.progressPercentage}%);"
            />
          </div>

          <h1 class="text-4xl font-bold">{user.progressPercentage}%</h1>
        </div>
      </div>
    </div>

    <!-- learning activities (second section) -->
    <div class="mt-10">
      <h3>Learning Activities</h3>

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
        <h3>Lessons</h3>

        <Tabs {tabs} bind:currentTab {onChange}>
          <slot:fragment slot="content">
            <TabContent value={getValue('PENDING')} index={currentTab}>
              <div class="flex flex-col gap-3 -mt-5 max-h-[45vh] overflow-y-scroll">
                {#if user?.pendingCourses?.length > 0}
                  {#each user?.pendingCourses as pending}
                    <div class="border border-[#DEDEDE] rounded-sm p-4 flex flex-col gap-4">
                      <h3 class="m-0 leading-4 font-semibold">{pending.title}</h3>

                      <div class="flex justify-between items-center">
                        <div class="flex items-center gap-1.5 text-xs">
                          <Calendar size={16} />
                          <!-- {pending.date} -->
                          Mon, July 01 2024
                        </div>

                        <div class="flex items-center gap-1.5 text-xs">
                          <PresentationFile size={16} />
                          {pending.total_lessons} Exercises
                        </div>

                        <div class="flex items-center gap-1.5 text-xs">
                          <Notebook size={16} />
                          30 minutes of reading
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
                {#if user?.completedCourses?.length > 0}
                  {#each user?.completedCourses as pending}
                    <div class="border border-[#DEDEDE] rounded-sm p-4 flex flex-col gap-4">
                      <h3 class="m-0 leading-4 font-semibold">{pending.title}</h3>

                      <div class="flex justify-between items-center">
                        <div class="flex items-center gap-1.5 text-xs">
                          <Calendar size={16} />
                          <!-- {pending.date} -->
                          Mon, July 01 2024
                        </div>

                        <div class="flex items-center gap-1.5 text-xs">
                          <PresentationFile size={16} />
                          {pending.total_lessons} Exercises
                        </div>

                        <div class="flex items-center gap-1.5 text-xs">
                          <Notebook size={16} />
                          30 minutes of reading
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
        <h3>Activities</h3>

        <div class="max-h-[50vh] overflow-y-scroll">
          <BarChartSimple data={chartData} {options} />
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
