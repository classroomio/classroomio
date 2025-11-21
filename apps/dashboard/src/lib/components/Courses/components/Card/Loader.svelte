<script lang="ts">
  import { Skeleton } from '@cio/ui/base/skeleton';
</script>

<div class="root relative mb-4 mr-4 w-72 rounded-md border bg-gray-100 transition ease-in-out dark:bg-black">
  <Skeleton class="h-40 w-full" />
  <div class="p-3 pb-0">
    <!-- Title -->
    <Skeleton class="h-4 w-2/4" />

    <!-- Description -->
    <Skeleton class="h-4 w-2/4" />
    <Skeleton class="h-4 w-2/4" />
    <Skeleton class="mt-4 h-4 w-full" />
    <Skeleton class="mb-4 h-4 w-full" />

    <div class="mb-3 flex justify-between">
      <Skeleton class="h-4 w-1/4" />
    </div>
    <Skeleton class="h-4 w-1/4" />
  </div>
</div>

<style>
  .root {
    min-height: 370px;
  }
</style>
