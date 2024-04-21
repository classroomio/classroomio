<script lang="ts">
  import { SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';
</script>

<div class="w-full">
  <SkeletonPlaceholder style="width: 100%; height: 10rem;" />
  <div class="my-3">
    <SkeletonText style="width: 100%;" />
    <SkeletonText style="width: 100%;" />
    <SkeletonText style="width: 100%;" />
  </div>
</div>
