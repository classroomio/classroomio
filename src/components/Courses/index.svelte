<script>
  import Box from '../Box/index.svelte';
  import { Moon } from 'svelte-loading-spinners';
  import Card from './components/Card/index.svelte';
  import CopyCourseModal from './components/CopyCourseModal/index.svelte';
  import { courses, courseMetaDeta } from './store';
</script>

<CopyCourseModal />

<div
  class="flex items-center justify-center lg:justify-start flex-wrap my-4 m-auto"
>
  {#if $courseMetaDeta.isLoading}
    <Box>
      <Moon size="60" color="#1d4ed8" unit="px" duration="1s" />
    </Box>
  {:else}
    {#each $courses as courseData}
      <Card
        id={courseData.id}
        logo={courseData.logo}
        title={courseData.title}
        description={courseData.description}
        role_id={courseData.role_id}
      />
    {:else}
      <Box>
        <h3 class="text-2xl text-gray-500">No Course Assigned</h3>
      </Box>
    {/each}
  {/if}
</div>
