<script lang="ts">
  import { Skeleton } from '@cio/ui/base/skeleton';
</script>

<div class="min-h-screen">
  <div class="px-4 py-8">
    <!-- Course Overview Cards Skeleton -->
    <div class="mb-12">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {#each Array(4) as _}
          <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
            <div class="flex items-center space-x-4">
              <Skeleton class="h-[48px] w-[48px]" />
              <div class="flex-1">
                <Skeleton class="h-[48px] w-[48px]" />
                <Skeleton class="h-[16px] w-[80px] mb-2" />
                <Skeleton class="h-[24px] w-[40px] mb-1" />
                <Skeleton class="h-[12px] w-[60px]" />
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Charts Section Skeleton -->
    <div class="mb-12">
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
        <Skeleton class="h-[24px] w-[200px] mb-6" />
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton class="w-full h-[300px]" />
          <Skeleton class="w-full h-[300px]" />
        </div>
      </div>
    </div>

    <!-- Students Table Skeleton -->
    <div class="rounded-lg border border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      <div class="border-b border-gray-200 px-6 py-4 dark:border-neutral-700">
        <Skeleton class="h-[24px] w-[200px] mb-6" />
      </div>
      <div class="p-6">
        <div class="space-y-4">
          {#each Array(5) as _}
            <div class="flex items-center space-x-4">
              <Skeleton class="h-[32px] w-[32px]" />
              <div class="flex-1">
                <Skeleton class="h-[16px] w-[150px] mb-1" />
                <Skeleton class="h-[12px] w-[200px]" />
              </div>
              <Skeleton class="h-[16px] w-[80px]" />
              <Skeleton class="h-[16px] w-[60px]" />
              <Skeleton class="h-[20px] w-[40px]" />
              <Skeleton class="h-[12px] w-[80px]" />
              <Skeleton class="h-[32px] w-[100px]" />
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>
