<script>
  import Box from '../Box/index.svelte';
  import Card from './components/Card/index.svelte';
  import { courses } from './store';
</script>

<div
  class="flex items-center justify-center lg:justify-start flex-wrap my-4 m-auto"
>
  {#each $courses as courseData}
    <Card
      id={courseData.id}
      logo={courseData.logo}
      title={courseData.title}
      description={courseData.description}
    />
  {:else}
    <Box>
      <h3 class="text-2xl text-gray-500">No Course Assigned</h3>
    </Box>
  {/each}
</div>
