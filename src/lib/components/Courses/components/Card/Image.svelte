<script lang="ts">
  import { ImageLoader, SkeletonPlaceholder } from 'carbon-components-svelte';

  export let src: string | undefined;
  export let style = 'w-full';
</script>

<ImageLoader
  src={src || '/images/classroomio-course-img-template.jpg'}
  alt="Course Logo"
  {style}
  class="h-[200px] rounded dark:border dark:border-white"
>
  <svelte:fragment slot="loading">
    <SkeletonPlaceholder style="width: 100%; height: 200px;" />
  </svelte:fragment>
  <svelte:fragment slot="error">An error occurred.</svelte:fragment>
</ImageLoader>
