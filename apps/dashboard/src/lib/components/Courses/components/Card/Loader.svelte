<script lang="ts">
  import { SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';
</script>

<div
  class="root relative mb-4 mr-4 w-72 rounded-md border bg-gray-100 transition ease-in-out dark:bg-black"
>
  <SkeletonPlaceholder style="width: 100%; height: 10rem;" />
  <div class="p-3 pb-0">
    <!-- Title -->
    <SkeletonText style="width: 50%;" />
    <!-- Description -->
    <SkeletonText style="width: 100%; margin-top: 1rem;" />
    <SkeletonText style="width: 100%; margin-bottom: 1rem;" />

    <div class="mb-3 flex justify-between">
      <SkeletonText style="width: 25%" />
      <SkeletonText style="width: 25%" />
    </div>
    <SkeletonText style="width: 25%" />
  </div>
</div>

<style>
  .root {
    min-height: 370px;
  }
</style>
