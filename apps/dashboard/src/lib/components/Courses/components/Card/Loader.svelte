<script lang="ts">
  import { Skeleton } from '@cio/ui/base/skeleton';
</script>

<div class="mb-4 mr-4 h-[370px] w-72 rounded-md border bg-gray-100 p-2 transition ease-in-out dark:bg-black">
  <Skeleton class="h-[45%] w-full" />
  <div class="flex h-[50%] flex-col justify-between pb-2 pt-4">
    <!-- Title -->
    <Skeleton class="h-4 w-2/4" />

    <!-- Description -->
    <div class="mb-6 mt-4 flex flex-col gap-2">
      <Skeleton class=" h-4 w-full" />
      <Skeleton class=" h-4 w-full" />
      <Skeleton class=" h-4 w-full" />
    </div>

    <div class="flex justify-between">
      <Skeleton class="h-4 w-1/4" />
      <Skeleton class="h-4 w-1/4" />
    </div>
  </div>
</div>
