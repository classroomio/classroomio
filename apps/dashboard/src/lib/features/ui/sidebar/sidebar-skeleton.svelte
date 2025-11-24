<script>
  import { Skeleton } from '@cio/ui/base/skeleton';
</script>

<div class="bg-sidebar flex h-[calc(100vh-48px)] w-64 flex-col gap-2 border-r p-2">
  <!-- org switcher -->
  <div class="flex items-center gap-2 rounded-md p-2">
    <Skeleton class="h-8 w-8 rounded-lg" />
    <div class="flex flex-1 flex-col gap-1">
      <Skeleton class="h-4 w-24" />
      <Skeleton class="h-3 w-16" />
    </div>
    <Skeleton class="h-4 w-4" />
  </div>

  <!-- nav main -->
  <div class="flex flex-col gap-1 py-2">
    <Skeleton class="mb-2 h-3 w-16 px-2" />
    {#each Array(5) as _, i (i)}
      <div class="flex items-center gap-2 rounded-md p-2">
        <Skeleton class="h-4 w-4" />
        <Skeleton class="h-4 w-full" />
      </div>
    {/each}
  </div>

  <!-- spacer -->
  <div class="flex-1"></div>

  <!-- upgrade banner -->
  <div class="mx-4 mb-2 flex flex-col items-center gap-3 rounded-md border p-4">
    <Skeleton class="h-16 w-16 rounded-md" />
    <div class="flex flex-col items-center gap-2">
      <Skeleton class="h-4 w-32" />
      <Skeleton class="h-3 w-40" />
    </div>
    <Skeleton class="h-9 w-24 rounded-md" />
  </div>

  <!-- nav user -->
  <div class="flex items-center gap-2 rounded-md p-2">
    <Skeleton class="h-8 w-8 rounded-lg" />
    <div class="flex flex-1 flex-col gap-1">
      <Skeleton class="h-4 w-24" />
      <Skeleton class="h-3 w-20" />
    </div>
    <Skeleton class="h-4 w-4" />
  </div>
</div>
