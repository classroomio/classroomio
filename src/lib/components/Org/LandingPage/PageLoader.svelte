<script>
  import { SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
</script>

<section class="w-screen h-screen p-5">
  <!-- navbar -->
  <div class="flex items-center justify-between w-full rounded-md overflow-hidden">
    <SkeletonText style="width:80%; margin-right:10rem;border-radius:10px" />
    <div class="flex items-center justify-between w-[20%]">
      <SkeletonText style="width:2%;  margin-right:1rem; border-radius:10px" />
      <SkeletonText style="width:2%;  margin-right:1rem; border-radius:10px" />
      <SkeletonText style="width:2%;  border-radius:10px" />
    </div>
  </div>
  <!-- hero -->
  <div
    class="flex flex-row gap-5 items-start justify-center flex-wrap w-full my-8 rounded-md overflow-hidden"
  >
    <SkeletonPlaceholder style="width:100%; height:20rem" />
  </div>
  <!-- cards -->
  <div class="flex gap-5 items-center justify-center flex-wrap my-4 rounded-md overflow-hidden">
    <CardLoader />
    <CardLoader />
    <CardLoader />
  </div>
</section>
