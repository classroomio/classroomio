<script lang="ts">
  import { SkeletonPlaceholder } from 'carbon-components-svelte';
</script>

<div class="min-h-screen">
  <div class="px-4 py-8">
    <!-- Course Overview Cards Skeleton -->
    <div class="mb-12">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {#each Array(4) as _}
          <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
            <div class="flex items-center space-x-4">
              <SkeletonPlaceholder style="width: 48px; height: 48px;" />
              <div class="flex-1">
                <SkeletonPlaceholder style="width: 80px; height: 16px; margin-bottom: 8px;" />
                <SkeletonPlaceholder style="width: 40px; height: 24px; margin-bottom: 4px;" />
                <SkeletonPlaceholder style="width: 60px; height: 12px;" />
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Charts Section Skeleton -->
    <div class="mb-12">
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
        <SkeletonPlaceholder style="width: 200px; height: 24px; margin-bottom: 24px;" />
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SkeletonPlaceholder style="width: 100%; height: 300px;" />
          <SkeletonPlaceholder style="width: 100%; height: 300px;" />
        </div>
      </div>
    </div>

    <!-- Students Table Skeleton -->
    <div class="rounded-lg border border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      <div class="border-b border-gray-200 px-6 py-4 dark:border-neutral-700">
        <SkeletonPlaceholder style="width: 200px; height: 24px;" />
      </div>
      <div class="p-6">
        <div class="space-y-4">
          {#each Array(5) as _}
            <div class="flex items-center space-x-4">
              <SkeletonPlaceholder style="width: 32px; height: 32px;" />
              <div class="flex-1">
                <SkeletonPlaceholder style="width: 150px; height: 16px; margin-bottom: 4px;" />
                <SkeletonPlaceholder style="width: 200px; height: 12px;" />
              </div>
              <SkeletonPlaceholder style="width: 80px; height: 16px;" />
              <SkeletonPlaceholder style="width: 60px; height: 16px;" />
              <SkeletonPlaceholder style="width: 40px; height: 20px;" />
              <SkeletonPlaceholder style="width: 80px; height: 12px;" />
              <SkeletonPlaceholder style="width: 100px; height: 32px;" />
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>
