<script>
  import { SkeletonPlaceholder } from 'carbon-components-svelte';
</script>

<div class="mx-auto max-w-4xl pt-14">
  <SkeletonPlaceholder style="width: 100%; height: 10rem;" />
  <div class="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    <SkeletonPlaceholder style="width: 270px; height: 10rem;" />
    <SkeletonPlaceholder style="width: 270px; height: 10rem;" />
    <SkeletonPlaceholder style="width: 270px; height: 10rem;" />
  </div>
</div>
