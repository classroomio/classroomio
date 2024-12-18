<script lang="ts">
  import PrimaryButton from './PrimaryButton.svelte';

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

<div class="h-fit min-w-[250px] max-w-[350px] space-y-4 md:w-[300px] md:min-w-[300px]">
  <div class="space-y-4 rounded-sm border border-gray-100 p-4 {className} w-full bg-gray-50">
    <div class="flex items-center justify-between">
      <p class="font-slab line-clamp-2 w-full text-lg font-normal capitalize">{title}</p>
    </div>

    <div class="overflow-hidden rounded-sm">
      <img
        src={bannerImage ? bannerImage : '/course-banner.jpg'}
        alt="course banner"
        class="h-44 w-full"
      />
    </div>

    <PrimaryButton label="Start Course" href={`/course/${slug}`} class="w-full text-start" />
  </div>
</div>
