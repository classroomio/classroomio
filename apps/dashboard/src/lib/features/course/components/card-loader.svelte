<script lang="ts">
  import { Skeleton } from '@cio/ui/base/skeleton';
</script>

<div class="mr-4 mb-4 h-[370px] w-72 rounded-md border p-2 transition ease-in-out">
  <Skeleton class="h-[45%] w-full" />
  <div class="flex h-[50%] flex-col justify-between pt-4 pb-2">
    <!-- Title -->
    <Skeleton class="h-4 w-2/4" />

    <!-- Description -->
    <div class="mt-4 mb-6 flex flex-col gap-2">
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
