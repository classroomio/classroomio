<script lang="ts">
  import { SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';
</script>

<div
  class="root w-72 border bg-white mr-4 mb-4 rounded-md transition ease-in-out relative"
>
  <SkeletonPlaceholder style="width: 100%; height: 10rem;" />
  <div class="p-3 pb-0">
    <!-- Title -->
    <SkeletonText style="width: 50%;" />
    <!-- Description -->
    <SkeletonText style="width: 100%; margin-top: 1rem;" />
    <SkeletonText style="width: 100%; margin-bottom: 1rem;" />

    <div class="flex justify-between mb-3">
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
