<script>
  import Student from '$lib/components/LMS/components/Student.svelte';
  import Learning from '$lib/components/LMS/components/Learning.svelte';
  import { courseInProgress } from '$lib/components/LMS/components/store';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>Student Dashboard - ClassroomIO</title>
</svelte:head>

<section class="m-5 w-[calc(100vw - 300px)] h-full gap-5">
  <h1 class="text-3xl font-semibold">Dashboard</h1>
  <div
    class="w-full h-fit lg:h-[265px] flex items-center justify-between p-2 md:p-5 lg:p-10 rounded-md bg-[#042172] my-2"
  >
    <span>
      <p class="w-full md:w-[75%] lg:w-[80%] text-white text-xs lg:text-xl font-normal mb-5">
        Today is another day to bring you closer to your learning goals. Don’t give up, the more you
        learn the better you get.
      </p>
      <PrimaryButton
        label="Start learning"
        variant={VARIANTS.CONTAINED_WHITE}
        className="bg-white text-blue-800"
        onClick={() => goto('/lms/mylearning')}
      />
    </span>
    <img
      src="/images/student-learning.svg"
      alt="student Learning Pictogram"
      class="hidden md:block md:w-20 md:h-16 lg:w-[275px] lg:h-[205px]"
    />
  </div>
  <main class="flex w-full h-full flex-col xl:flex-row gap-5">
    <div class="w-full h-full">
      <Student />
    </div>

    <div class="w-full h-full">
      <Learning />
    </div>
    <Box
      className="w-full xl:w-[400px] h-full bg-[#F5F8FE] dark:bg-gray-500 flex items-center justify-center my-20 xl:mt-11 p-2"
    >
      <div
        class="w-full h-full flex flex-col md:flex-row xl:flex-col items-center md:items-center xl:items-start gap-5 md:justify-around"
      >
        <div>
          <img src="/images/target.svg" alt="student Learning score" />
        </div>
        <span class="text-center xl:text-start">
          <p class="text-base font-semibold py-2 text-[#040F2D] dark:text-white">Your Progress</p>
          {#if courseInProgress}
            <p class="text-xs font-normal text-[#656565] dark:text-white">2/15 lessons completed</p>
          {:else}
            <p class="text-xs font-normal text-[#656565] dark:text-white">No lessons started</p>
          {/if}
        </span>
        <h1 class="text-5xl md:text-7xl font-bold text-[#262626] dark:text-white my-0">
          {courseInProgress ? 1 : 0} %
        </h1>
      </div>
    </Box>
  </main>
</section>
