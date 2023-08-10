<script>
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { course } from '$lib/components/Course/store';
  import Box from '$lib/components/Box/index.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import { courseInProgress } from './store';

  const mockData = [
    {
      title: 'Colorful digital painting',
      description: 'Learn the basics of figma and start design web apps for the world ...',
      src: '/painting.png',
      progress: 'w-[30%]'
    },
    {
      title: 'Photo editing 101',
      description: 'Learn the different techniques to edit photos using Adobe Lightroom.',
      src: '/digital.png',
      progress: 'w-[45%]'
    }
  ];
</script>

<section class="h-full mt-10 mb-20 xl:mt-2">
  <p class="text-base font-semibold text-[#040F2D] pb-3 dark:text-white">Currently Learning</p>
  <Box className="w-full h-full border-2 border-[#EAEAEA] gap-10 rounded">
    {#if courseInProgress === false}
      <div class="flex flex-col items-center">
        <CoursesEmptyIcon />
        <h3 class="">No courses progress yet</h3>
        <p class="w-[75%] text-center">Once you start a course, your progress will reflect here</p>
      </div>
    {:else}
      <div class="w-full h-full flex flex-col justify-start">
        {#each mockData as data, index}
          <div class="p-5">
            <span class="flex flex-col md:flex-row gap-3 items-start pb-5">
              <img src={data.src} alt="course" class="hidden md:block md:w-[60px] md:h-[60px]" />
              <div class="w-full">
                <p class="text-base font-semibold dark:text-white">{data.title}</p>
                <p class="text-xs font-normal text-[#656565] dark:text-white">{data.description}</p>
              </div>
              <PrimaryButton
                label="continue"
                variant={VARIANTS.OUTLINED}
                className="rounded-none text-[#0233BD]"
              />
            </span>
            <div class="relative bg-[#EAEAEA] w-full h-1">
              <div class={`absolute top-0 left-0 bg-[#0233BD] h-full ${data.progress} ]`} />
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Box>
</section>
