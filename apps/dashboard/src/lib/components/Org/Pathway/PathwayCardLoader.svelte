<script lang="ts">
  import { SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';
</script>

<div
  class="border-gray hover:border-primary-600 group relative w-[480px] rounded-md border-2 p-3 text-black dark:border-neutral-600 dark:text-white"
>
  <div class="flex items-center justify-evenly gap-3">
    <div class="w-full max-w-[122px]">
      <SkeletonPlaceholder
        class="relative h-[122px] w-full rounded-md object-cover dark:border dark:border-neutral-600"
      />
    </div>

    <div class="w-4/6">
      <h3 class="mb-2 mt-0 text-lg font-medium">
        <SkeletonText style="width: 50%;" />
      </h3>
      <p class="line-clamp-2 text-sm text-gray-500">
        <SkeletonText style="width: 100%; margin-top: 1rem;" />
      </p>

      <div class="mt-2 flex items-center justify-between">
        <SkeletonText style="width: 20%;" />

        <SkeletonText style="width: 20%;" />
      </div>
    </div>
  </div>
</div>
