<script lang="ts">
  import { SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';
</script>

<div
  class="root w-full border border-gray-100 dark:bg-gray-700 mr-4 mb-4 rounded-md transition ease-in-out relative flex p-3"
>
  <SkeletonPlaceholder style="width: 20%; height: 100%;" />
  <div class="w-full mx-5 flex justify-evenly flex-col">
    <!-- Title -->
    <SkeletonText style="width: 50%;" />
    <!-- Description -->
    <SkeletonText style="width: 50%; height: 4rem;" />
  </div>
</div>

<style>
  .root {
    height: 180px;
  }
</style>
