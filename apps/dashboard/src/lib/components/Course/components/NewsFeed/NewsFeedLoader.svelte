<script>
  import { SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';
</script>

<div class="mb-7 flex max-w-3xl flex-col gap-5 rounded-md border border-gray-300 p-4">
  <div class="flex items-center gap-2">
    <SkeletonPlaceholder style="height: 2rem; width: 2rem;" class="overflow-hidden rounded-full" />
    <SkeletonText width="30%" />
  </div>
  <SkeletonText paragraph lines={3} />
</div>
