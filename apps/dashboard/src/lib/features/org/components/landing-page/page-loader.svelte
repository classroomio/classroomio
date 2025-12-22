<script>
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { CourseCardLoader } from '$features/course/components';
</script>

<section class="h-screen w-screen p-5">
  <!-- navbar -->
  <div class="flex w-full items-center justify-between overflow-hidden rounded-md">
    <Skeleton class="mr-40 h-4 w-[80%] rounded-[10px]" />
    <div class="flex w-[20%] items-center justify-between">
      <Skeleton class="mr-1 h-4 w-[2%] rounded-[10px]" />
      <Skeleton class="mr-1 h-4 w-[2%] rounded-[10px]" />
      <Skeleton class="h-4 w-[2%] rounded-[10px]" />
    </div>
  </div>
  <!-- hero -->
  <div class="my-8 flex w-full flex-row flex-wrap items-start justify-center gap-5 overflow-hidden rounded-md">
    <Skeleton class="h-80 w-full rounded-md" />
  </div>
  <!-- cards -->
  <div class="my-4 flex flex-wrap items-center justify-center gap-5 overflow-hidden rounded-md">
    <CourseCardLoader />
    <CourseCardLoader />
    <CourseCardLoader />
  </div>
</section>

