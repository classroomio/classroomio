<script lang="ts">
  import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
</script>

<div
  class="root w-72 border bg-gray-100 dark:bg-black mr-4 mb-4 rounded-md transition ease-in-out relative"
>
  <Skeleton style="width: 100%; height: 10rem;" />
  <div class="p-3 pb-0">
    <!-- Title -->
    <Skeleton style="width: 50%;" />
    <!-- Description -->
    <Skeleton style="width: 100%; margin-top: 1rem;" />
    <Skeleton style="width: 100%; margin-bottom: 1rem;" />

    <div class="flex justify-between mb-3">
      <Skeleton style="width: 25%" />
      <Skeleton style="width: 25%" />
    </div>
    <Skeleton style="width: 25%" />
  </div>
</div>

<style>
  .root {
    min-height: 370px;
  }
</style>
