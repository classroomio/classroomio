<script>
  import Box from '$lib/components/Box/index.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import { courseInProgress } from './store';
  import Card from '$lib/components/Courses/components/Card/index.svelte';
</script>

<section>
  {#if courseInProgress.length > 0}
    <div
      class="flex items-center justify-center md:justify-start flex-wrap gap-4 dark:text-white mt-2"
    >
      {#each courseInProgress as data}
        {#key data.id}
          <Card
            id={data.id}
            bannerImage={data.src || '/images/classroomio-course-img-template.jpg'}
            title={data.title}
            description={data.description}
            isLMS={true}
            progressRate={data.progressRate}
          />
        {/key}
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
