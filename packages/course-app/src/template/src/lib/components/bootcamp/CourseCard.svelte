<script lang="ts">
  interface Props {
    className?: string;
    bannerImage?: string;
    slug: string;
    title: string;
  }

  let { className, bannerImage, title, slug }: Props = $props();

  function getCourseUrl() {
    return `/course/${slug}`;
  }
</script>

<div class="h-fit w-full min-w-[250px] max-w-[300px] space-y-4 md:min-w-[300px]">
  <div class="space-y-4 rounded-sm border border-gray-100 p-4 {className} w-full bg-gray-50">
    <div class="flex items-center justify-between">
      <p class="font-slab line-clamp-1 w-full text-lg font-normal capitalize">{title}</p>
    </div>

    <div class="overflow-hidden rounded-sm">
      <img
        src={bannerImage ? bannerImage : '/course-banner.jpg'}
        alt="course banner"
        class="h-44 w-full"
      />
    </div>

    <a href={getCourseUrl()} class="hover:no-underline">
      <div
        class="font-roboto bg-bootcamp mt-4 w-full cursor-pointer rounded-sm p-3 text-start font-medium uppercase transition-all duration-200 hover:scale-90 hover:no-underline"
      >
        Register here
      </div>
    </a>
  </div>
</div>
