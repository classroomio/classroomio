<script lang="ts">
  import { SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';
</script>

<div
  class="h-[70px] w-full border border-gray-100 dark:bg-neutral-800 mr-4 mb-4 mt-2 rounded-md transition ease-in-out relative flex pt-3 px-3"
>
  <div class="w-10 flex justify-evenly flex-col px-1 mr-2 rounded-md">
    <SkeletonPlaceholder style="width: 100%; height: 40%; border-radius: 4px;" />
    <SkeletonPlaceholder style="width: 100%; height: 40%; border-radius: 4px;" />
  </div>

  <div class="w-9/12 mt-1.5 flex justify-evenly flex-col rounded-md">
    <!-- first text -->
    <div class="w-3/6 h-full">
      <SkeletonText style="height: 50%; border-radius: 4px;" />
    </div>
    <!-- second text -->
    <SkeletonText style="width: 10%; height: 50%; border-radius: 4px;" />
  </div>

  <div class="w-10 justify-evenly flex-col px-1 mt-1.5 ml-auto rounded-md">
    <SkeletonPlaceholder style="width: 100%; height: 41%; border-radius: 4px;" />
  </div>
</div>
