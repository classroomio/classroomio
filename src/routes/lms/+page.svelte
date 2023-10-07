<script lang="ts">
  import Learning from '$lib/components/LMS/components/Learning.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { goto } from '$app/navigation';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { fetchCourses } from '$lib/components/Courses/api';
  import { courses, courseMetaDeta } from '$lib/components/Courses/store';
  import type { Course } from '$lib/utils/types';

  let hasFetched = false;
  let progressPercentage = 0;
  let totalLessons = 0;
  let totalComPleted = 0;

  async function getCourses(userId: string | null, orgId: string) {
    if (hasFetched || !userId || !orgId) {
      return;
    }
    $courseMetaDeta.isLoading = true;

    const coursesResult = await fetchCourses(userId, orgId);
    console.log(`coursesResult`, coursesResult);

    $courseMetaDeta.isLoading = false;
    if (!coursesResult) return;

    courses.set(coursesResult.allCourses);
    hasFetched = true;
  }

  function calcTotalProgress(courses: Course[]) {
    totalComPleted = courses.reduce((acc, cur) => acc + (cur.progress_rate || 0), 0);
    totalLessons = courses.reduce((acc, cur) => acc + (cur.total_lessons || 0), 0);

    progressPercentage = Math.round((totalComPleted / totalLessons) * 100);
  }

  $: getCourses($profile.id, $currentOrg.id);
  $: calcTotalProgress($courses);
</script>

<svelte:head>
  <title>Student Dashboard - ClassroomIO</title>
</svelte:head>

<section class="max-w-6xl gap-5 mx-auto">
  <div class="m-5">
    <h1 class="text-3xl font-semibold">Welcome</h1>
    <div
      class="w-full h-fit lg:h-[265px] flex md:items-center justify-between flex-col-reverse md:flex-row p-5 lg:p-10 rounded-md bg-primary-900 my-2"
    >
      <span>
        <p class="w-full md:w-[75%] lg:w-[80%] text-white text-xs lg:text-xl font-normal mb-5">
          Today is another day to bring you closer to your learning goals. Don’t give up, the more
          you learn the better you get.
        </p>
        <PrimaryButton
          label="Start learning"
          variant={VARIANTS.CONTAINED_WHITE}
          className="bg-white text-primary-800"
          onClick={() => goto('/lms/mylearning')}
        />
      </span>
      <img
        src="/images/student-learning.svg"
        alt="student Learning Pictogram"
        class="w-28 md:block md:w-1/3 lg:w-[275px] lg:h-[205px] mb-3 md:mb-0"
      />
    </div>
    <section class="flex w-full flex-col xl:flex-row xl:gap-5">
      <div class="w-full md:w-[75%] mt-10 xl:mt-2">
        <Learning />
      </div>
      <div class="mt-10 xl:mt-2 w-full md:w-[75%] xl:w-[400px]">
        <p class="text-base font-semibold text-[#040F2D] pb-3 dark:text-white">Your Progress</p>
        <div
          class="flex items-center justify-center border border-[#EAEAEA] dark:bg-neutral-800 gap-2 rounded h-fit lg:h-[40vh] lg:overflow-y-auto p-3"
        >
          <div
            class="w-full h-full flex flex-col sm:flex-row xl:flex-col items-center justify-between md:items-center xl:items-start gap-5 md:justify-around"
          >
            <div>
              <img src="/images/target.svg" alt="student Learning score" />
            </div>
            <span class="text-center xl:text-start">
              <p class="text-base font-semibold py-2 text-[#040F2D] dark:text-white">
                Your Progress
              </p>
              {#if totalLessons > 0}
                <p class="text-xs font-normal text-[#656565] dark:text-white">
                  {totalComPleted}/{totalLessons} lessons completed
                </p>
              {:else}
                <p class="text-xs font-normal text-[#656565] dark:text-white">No courses started</p>
              {/if}
            </span>
            <h1 class="text-5xl md:text-6xl font-bold text-[#262626] dark:text-white my-0">
              {progressPercentage} %
            </h1>
          </div>
        </div>
      </div>
    </section>
  </div>
</section>
