<script lang="ts">
  import { SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';
</script>

<div
  class="root relative mb-4 mr-4 flex w-full rounded-md border border-gray-100 p-3 transition ease-in-out dark:border-neutral-600 dark:bg-neutral-800"
>
  <SkeletonPlaceholder style="width: 20%; height: 100%;" />
  <div class="mx-5 flex w-full flex-col justify-evenly">
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
