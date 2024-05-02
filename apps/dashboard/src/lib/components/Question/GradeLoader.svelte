<script>
  import { SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';
</script>

<div class="flex w-full px-2 py-4">
  <div class="w-full flex flex-row items-start space-x-4">
    <img src="/ai.svg" alt="alt" class="animate-pulse" />
    <div class="w-full">
      <SkeletonText width="100%" paragraph lines={3} />
    </div>
  </div>
  <div class="flex space-x-2">
    <SkeletonPlaceholder style="height: 2rem; width: 5rem;" />
    <SkeletonPlaceholder style="height: 2rem; width: 5rem;" />
  </div>
</div>
