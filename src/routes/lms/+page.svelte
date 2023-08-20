<script>
  import Student from '$lib/components/LMS/components/Student.svelte';
  import Learning from '$lib/components/LMS/components/Learning.svelte';
  import {
    courseInProgress,
    totalCourses,
    progressPercentage
  } from '$lib/components/LMS/components/store';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>Student Dashboard - ClassroomIO</title>
</svelte:head>

<section class="max-w-[1240px] gap-5 mx-auto">
  <div class="m-5">
    <h1 class="text-3xl font-semibold">Dashboard</h1>
    <div
      class="w-full h-fit lg:h-[265px] flex md:items-center justify-between flex-col-reverse md:flex-row p-5 lg:p-10 rounded-md bg-[#042172] my-2"
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
    <main class="flex w-full h-full flex-col xl:flex-row xl:gap-5">
      <div class="w-full h-full">
        <Student />
      </div>

      <div class="w-full h-full">
        <Learning />
      </div>
      <div
        class="flex items-center justify-center border border-[#EAEAEA] dark:bg-gray-700 gap-2 rounded w-full xl:w-[400px] h-fit xl:h-[516px] overflow-y-auto p-3 xl:mt-11"
      >
        <div
          class="w-full h-full flex flex-col sm:flex-row xl:flex-col items-center md:items-center xl:items-start gap-5 md:justify-around"
        >
          <div>
            <img src="/images/target.svg" alt="student Learning score" />
          </div>
          <span class="text-center xl:text-start">
            <p class="text-base font-semibold py-2 text-[#040F2D] dark:text-white">Your Progress</p>
            {#if courseInProgress.length > 0}
              <p class="text-xs font-normal text-[#656565] dark:text-white">
                {courseInProgress.length}/{totalCourses} lessons in progress
              </p>
            {:else}
              <p class="text-xs font-normal text-[#656565] dark:text-white">No lessons started</p>
            {/if}
          </span>
          <h1 class="text-5xl md:text-6xl font-bold text-[#262626] dark:text-white my-0">
            {progressPercentage} %
          </h1>
        </div>
      </div>
    </main>
  </div>
</section>
