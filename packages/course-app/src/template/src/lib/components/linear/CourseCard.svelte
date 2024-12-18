<script lang="ts">
  import Tag from 'carbon-icons-svelte/lib/Tag.svelte';
  import { ArrowRight } from 'carbon-icons-svelte';

  interface Props {
    className?: string;
    bannerImage: string | undefined;
    slug?: string;
    title?: string;
    cost: number;
    description?: string;
  }

  let {
    className = '',
    bannerImage,
    slug = '',
    title = '',
    description = '',
    cost
  }: Props = $props();

  function getCourseUrl() {
    return `/course/${slug}`;
  }
</script>

<div
  class="relative mx-2 max-h-[500px] min-h-[400px] w-full overflow-hidden rounded-lg bg-no-repeat object-cover md:w-fit md:max-w-[350px]"
  style="background-image: url({bannerImage ? bannerImage : '/course-banner.jpg'});"
>
  <div class="absolute inset-0 z-10 bg-black/40"></div>

  <div class="relative flex max-h-[500px] min-h-[400px] w-full flex-col justify-between p-2">
    <div class="flex flex-1 flex-col items-start p-4">
      <p class="z-10 line-clamp-1 overflow-ellipsis text-lg font-semibold text-white">
        {title}
      </p>
      <p class="z-10 line-clamp-3 overflow-ellipsis text-justify text-white">
        {description}
      </p>
    </div>

    <a
      href={getCourseUrl()}
      class=" z-10 mt-auto flex items-center justify-between rounded-2xl bg-black/70 p-2"
    >
      <div class="text-semibold flex items-center gap-1 text-lg">
        <span class="flex items-center justify-center gap-2 rounded-full bg-white p-1">
          <Tag class="text-black" size={14} />
        </span>

        {cost ? `${cost}` : 'Free'}
      </div>
      <span class="bg-linear flex items-center justify-center rounded-full p-2">
        <ArrowRight class="text-black" />
      </span>
    </a>
  </div>
</div>
