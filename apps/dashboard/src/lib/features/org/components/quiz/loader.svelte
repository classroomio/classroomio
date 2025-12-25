<script lang="ts">
  import { Skeleton } from '@cio/ui/base/skeleton';
</script>

<div
  class="root relative mb-4 mr-4 flex w-full rounded-md border border-gray-100 p-3 transition ease-in-out dark:border-neutral-600 dark:bg-neutral-800"
>
  <Skeleton class="h-full w-[20%]" />
  <div class="mx-5 flex w-full flex-col justify-evenly">
    <!-- Title -->
    <Skeleton class="h-4 w-2/4" />
    <!-- Description -->
    <Skeleton class="h-16 w-2/4" />
  </div>
</div>

<style>
  .root {
    height: 180px;
  }
</style>
