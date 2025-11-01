<script lang="ts">
  import { SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';
</script>

<div
  class="relative mx-4 my-2 flex h-[70px] w-full rounded-md border border-gray-100 px-3 pt-3 transition ease-in-out dark:border-neutral-600 dark:bg-neutral-800"
>
  <div class="mr-2 flex w-10 flex-col justify-evenly rounded-md px-1">
    <SkeletonPlaceholder style="width: 100%; height: 40%; border-radius: 4px;" />
    <SkeletonPlaceholder style="width: 100%; height: 40%; border-radius: 4px;" />
  </div>

  <div class="mt-1.5 flex w-9/12 flex-col justify-evenly rounded-md">
    <!-- first text -->
    <div class="h-full w-3/6">
      <SkeletonText style="height: 50%; border-radius: 4px;" />
    </div>
    <!-- second text -->
    <SkeletonText style="width: 10%; height: 50%; border-radius: 4px;" />
  </div>

  <div class="ml-auto mt-1.5 w-10 flex-col justify-evenly rounded-md px-1">
    <SkeletonPlaceholder style="width: 100%; height: 41%; border-radius: 4px;" />
  </div>
</div>
