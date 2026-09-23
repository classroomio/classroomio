<script lang="ts">
  import { Skeleton } from '@cio/ui/base/skeleton';
</script>

<div class="space-y-6">
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {#each Array(4) as _, i (i)}
      <div class="ui:bg-card ui:border-border overflow-hidden rounded-xl border shadow-sm">
        <div class="ui:border-border space-y-2 border-b px-6 py-5">
          <Skeleton class="h-3 w-24" />
        </div>
        <div class="px-6 py-6">
          <Skeleton class="h-8 w-20" />
          <Skeleton class="mt-4 h-3 w-full max-w-[180px]" />
        </div>
      </div>
    {/each}
  </div>

  <div class="ui:bg-card ui:border-border overflow-hidden rounded-xl border shadow-sm">
    <div class="ui:border-border space-y-2 border-b px-6 py-5">
      <Skeleton class="h-5 w-48" />
      <Skeleton class="h-4 w-full max-w-md" />
    </div>
    <div class="space-y-4 px-6 py-6">
      {#each Array(5) as _, i (i)}
        <div class="flex items-center gap-3">
          <Skeleton class="size-6 rounded-full" />
          <div class="flex-1 space-y-2">
            <Skeleton class="h-4 w-2/3" />
            <Skeleton class="h-[22px] w-full" />
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="ui:bg-card ui:border-border overflow-hidden rounded-xl border shadow-sm">
    <div class="ui:border-border space-y-2 border-b px-6 py-5">
      <Skeleton class="h-5 w-56" />
      <Skeleton class="h-4 w-full max-w-md" />
    </div>
    <div class="space-y-2 px-6 py-4">
      {#each Array(3) as _, i (i)}
        <div class="flex items-center gap-3">
          <Skeleton class="size-9 rounded-lg" />
          <div class="min-w-0 flex-1 space-y-2">
            <Skeleton class="h-4 w-2/3" />
            <Skeleton class="h-3 w-1/2" />
          </div>
          <Skeleton class="h-6 w-16" />
        </div>
      {/each}
    </div>
  </div>

  <div class="ui:bg-card ui:border-border overflow-hidden rounded-xl border shadow-sm">
    <div class="ui:border-border border-b px-6 py-5">
      <Skeleton class="h-5 w-56" />
      <Skeleton class="mt-2 h-4 max-w-xl" />
    </div>
    <div class="ui:divide-border divide-y px-6 py-2">
      {#each Array(5) as _, i (i)}
        <div class="flex flex-wrap items-center gap-4 py-4">
          <Skeleton class="size-8 rounded-full" />
          <div class="min-w-0 flex-1 space-y-2">
            <Skeleton class="h-4 w-[150px]" />
            <Skeleton class="h-3 w-[200px]" />
          </div>
          <Skeleton class="h-4 w-[80px]" />
          <Skeleton class="h-4 w-[100px]" />
          <Skeleton class="h-6 w-[48px]" />
          <Skeleton class="h-8 w-[90px]" />
        </div>
      {/each}
    </div>
  </div>
</div>
