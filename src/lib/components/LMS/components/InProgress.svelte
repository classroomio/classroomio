<script>
  import { goto } from '$app/navigation';
  import Box from '$lib/components/Box/index.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { mockData, courseInProgress } from './store';

  const gotoCourse = (title) => {
    goto(`/courses/${title}`);
  };
</script>

<section>
  {#if courseInProgress.length > 0}
    <div
      class="flex items-center justify-center md:justify-start flex-wrap gap-4 dark:text-white mt-2"
    >
      {#each courseInProgress as data}
        <div
          class="w-80 min-h-[350px] flex items-start justify-start flex-wrap flex-col border rounded mr-2 mb-5 border-gray-200"
        >
          <img src={data.src} alt="course" class="w-80 h-[180px] object-cover" />

          <div class="w-full p-3">
            <p
              class="line-clamp-2 text-xl lg:text-2xl font-normal text-[#262626] py-1 dark:text-white"
            >
              {data.title}
            </p>
            <p class="line-clamp-2 text-base text-[#656565] dark:text-white py-1">
              {data.description}
            </p>
            <p class="py-1 text-[#7888B7] dark:text-white">By {data.author}</p>
            <span class="flex flex-wrap flex-row items-start gap-2 justify-between mt-8">
              <span>
                <p>{data.lessons} lessons</p>
                {#if data.inProgress}
                  <div class="flex items-center gap-2">
                    <div class=" relative bg-[#EAEAEA] w-full h-1">
                      <div class={`absolute top-0 left-0 bg-[#0233BD] h-full ${data.progress} ]`} />
                    </div>
                    <p class="text-xs text-[#656565] dark:text-white">{data.progressRate}%</p>
                  </div>
                {/if}
              </span>
              <PrimaryButton
                label={data.inProgress ? 'Continue Course' : 'Start Course'}
                variant={VARIANTS.OUTLINED}
                className="rounded-none text-[#0233BD]"
                onClick={() => gotoCourse(data.title)}
              />
            </span>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <Box className="flex flex-col items-center mt-2">
      <CoursesEmptyIcon />
      <h3 class="text-center">No course progress yet</h3>
      <p class="w-[70%] md:w-[35%] text-center">
        Once you start a course, your progress will reflect here
      </p>
    </Box>
  {/if}
</section>
