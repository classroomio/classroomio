<script lang="ts">
  import { Skeleton } from '@cio/ui/base/skeleton';
</script>

<div
  class="relative mx-4 my-2 flex h-[70px] w-full rounded-md border border-gray-100 px-3 pt-3 transition ease-in-out dark:border-neutral-600 dark:bg-neutral-800"
>
  <div class="mr-2 flex w-10 flex-col justify-evenly rounded-md px-1">
    <Skeleton class="h-[40%] w-full rounded-sm" />
    <Skeleton class="h-[40%] w-full rounded-sm" />
    <Skeleton class="h-[40%] w-full rounded-sm" />
  </div>

  <div class="mt-1.5 flex w-9/12 flex-col justify-evenly rounded-md">
    <!-- first text -->
    <div class="h-full w-3/6">
      <Skeleton class="h-[50%] w-full rounded-sm" />
    </div>
    <!-- second text -->
    <Skeleton class="h-4 w-1/4 rounded-sm" />
  </div>

  <div class="ml-auto mt-1.5 w-10 flex-col justify-evenly rounded-md px-1">
    <Skeleton class="h-[41%] w-full rounded-sm" />
  </div>
</div>
