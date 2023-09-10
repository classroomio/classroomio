<script lang="ts">
  import Box from '../Box/index.svelte';
  import Card from './components/Card/index.svelte';
  import CardLoader from './components/Card/Loader.svelte';
  import CoursesEmptyIcon from '../Icons/CoursesEmptyIcon.svelte';
  import CopyCourseModal from './components/CopyCourseModal/index.svelte';
  import { courses, courseMetaDeta } from './store';
</script>

<CopyCourseModal />

<div
  class={`w-full ${$courseMetaDeta.isLoading || $courses ? 'cards-container' : ''} my-4 mx-auto`}
>
  {#if $courseMetaDeta.isLoading}
    <CardLoader />
    <CardLoader />
    <CardLoader />
  {:else}
    {#each $courses as courseData}
      <Card
        id={courseData.id}
        logo={courseData.logo}
        bannerImage={courseData.banner_image}
        title={courseData.title}
        description={courseData.description}
        role_id={courseData.role_id}
        isPublished={courseData.is_published}
        cost={courseData.cost}
        currency={courseData.currency}
        totalLessons={courseData.total_lessons}
      />
      <!-- {:else}  
        <Box className="w-full">
          <CoursesEmptyIcon />
          <h3 class="dark:text-white text-2xl my-5">No Courses Created</h3>
          <p class="dark:text-white w-1/3 text-center">
            Share your knowledge with the world by creating engaging courses for your students.
          </p>
        </Box> -->
    {/each}
  {/if}
</div>
{#if !$courses.length}
  <Box className="w-full">
    <CoursesEmptyIcon />
    <h3 class="dark:text-white text-2xl my-5">No Courses Created</h3>
    <p class="dark:text-white w-1/3 text-center">
      Share your knowledge with the world by creating engaging courses for your students.
    </p>
  </Box>
{/if}
