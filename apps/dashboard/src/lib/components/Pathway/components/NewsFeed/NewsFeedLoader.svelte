<script>
  import { SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';
</script>

<div class="flex flex-col gap-5 border border-gray-300 p-4 rounded-md mb-7 max-w-3xl">
  <div class="flex items-center gap-2">
    <SkeletonPlaceholder style="height: 2rem; width: 2rem;" class="rounded-full overflow-hidden" />
    <SkeletonText width="30%" />
  </div>
  <SkeletonText paragraph lines={3} />
</div>
