<script lang="ts">
  import { goto } from '$app/navigation';
  import { Learning } from '$features/lms';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { coursesApi } from '$features/course/api';

  let totalCompleted = $derived(coursesApi.enrolledCourses.reduce((acc, cur) => acc + (cur.progressRate || 0), 0));
  
  let totalLessons = $derived(coursesApi.enrolledCourses.reduce((acc, cur) => acc + (cur.lessonCount || 0), 0));

  let progressPercentage = $derived(Math.round((totalCompleted / totalLessons) * 100) || 0);

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) return;

    coursesApi.getEnrolledCourses();
  });
</script>

<div class="flex h-fit w-full flex-col-reverse justify-between rounded-md border px-4 py-2 md:flex-row md:items-center">
  <div class="w-full md:w-[75%] lg:w-[80%]">
    <p class="mb-5 w-4/6 text-xs font-normal lg:text-xl">
      {$currentOrg.customization.dashboard.bannerText
        ? $currentOrg.customization.dashboard.bannerText
        : $t('dashboard.lms_dashboard_hero')}
    </p>
    <Button onclick={() => goto('/lms/mylearning')}>
      {$t('dashboard.continue_learning')}
    </Button>
  </div>
  <img
    src={$currentOrg.customization.dashboard.bannerImage
      ? $currentOrg.customization.dashboard.bannerImage
      : '/images/student-learning.svg'}
    alt="student Learning Pictogram"
    class="mb-3 aspect-square size-48 md:mb-0 md:block"
  />
</div>
<section class="flex w-full flex-col md:gap-4 lg:flex-row">
  <div class="mt-10 w-full lg:w-[50%] xl:mt-2">
    <Learning />
  </div>
  <div class="mt-10 w-full lg:w-[50%] xl:mt-2">
    <p class="pb-3 text-base font-semibold text-[#040F2D] dark:text-white">
      {$t('dashboard.your_progress')}
    </p>
    <div
      class="flex h-fit items-center justify-center gap-2 rounded border border-[#EAEAEA] p-3 lg:h-[40vh] lg:overflow-y-auto dark:bg-neutral-800"
    >
      <div
        class="flex h-full w-full flex-col items-center justify-between gap-5 sm:flex-row lg:items-center lg:justify-around"
      >
        <div>
          <img src="/images/target.svg" alt="student Learning score" />
        </div>
        <span class="text-center xl:text-start">
          <p class="py-2 text-base font-semibold text-[#040F2D] dark:text-white">
            {$t('dashboard.your_progress')}
          </p>
          {#if totalLessons > 0}
            <p class="text-xs font-normal text-[#656565] dark:text-white">
              {totalCompleted}/{totalLessons}
              {$t('dashboard.lessons_completed')}
            </p>
          {:else}
            <p class="text-xs font-normal text-[#656565] dark:text-white">
              {$t('dashboard.no_courses_started')}
            </p>
          {/if}
        </span>
        <h1 class="my-0 whitespace-nowrap text-5xl text-[#262626] lg:text-6xl dark:text-white">
          {progressPercentage} %
        </h1>
      </div>
    </div>
  </div>
</section>
