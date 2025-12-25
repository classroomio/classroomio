<script lang="ts">
  import { Skeleton } from '@cio/ui/base/skeleton';
</script>

<div class="relative flex h-[70px] w-full rounded-md border p-2 transition ease-in-out">
  <div class="mr-2 flex w-10 flex-col justify-evenly gap-2 rounded-md px-1">
    <Skeleton class="h-2/6 w-full rounded-sm" />
    <Skeleton class="h-2/6 w-full rounded-sm" />
    <Skeleton class="h-2/6 w-full rounded-sm" />
  </div>

  <div class="flex w-9/12 flex-col gap-2 rounded-md">
    <!-- first text -->
    <Skeleton class="h-4 w-3/6 rounded-sm" />
    <!-- second text -->
    <Skeleton class="h-4 w-1/4 rounded-sm" />
  </div>

  <div class="ml-auto w-10 flex-col justify-evenly rounded-md px-1">
    <Skeleton class="h-4 w-full rounded-sm" />
  </div>
</div>
