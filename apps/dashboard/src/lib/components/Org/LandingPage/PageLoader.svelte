<script>
  import { SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
</script>

<section class="h-screen w-screen p-5">
  <!-- navbar -->
  <div class="flex w-full items-center justify-between overflow-hidden rounded-md">
    <SkeletonText style="width:80%; margin-right:10rem;border-radius:10px" />
    <div class="flex w-[20%] items-center justify-between">
      <SkeletonText style="width:2%;  margin-right:1rem; border-radius:10px" />
      <SkeletonText style="width:2%;  margin-right:1rem; border-radius:10px" />
      <SkeletonText style="width:2%;  border-radius:10px" />
    </div>
  </div>
  <!-- hero -->
  <div
    class="my-8 flex w-full flex-row flex-wrap items-start justify-center gap-5 overflow-hidden rounded-md"
  >
    <SkeletonPlaceholder style="width:100%; height:20rem" />
  </div>
  <!-- cards -->
  <div class="my-4 flex flex-wrap items-center justify-center gap-5 overflow-hidden rounded-md">
    <CardLoader />
    <CardLoader />
    <CardLoader />
  </div>
</section>
