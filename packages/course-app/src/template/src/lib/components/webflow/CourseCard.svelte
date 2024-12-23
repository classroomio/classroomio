<script lang="ts">
  import PrimaryButton from './PrimaryButton.svelte';

  interface Props {
    className?: string;
    bannerImage: string | undefined;
    slug?: string;
    title?: string;
    description?: string;
  }

  let { className = '', bannerImage, slug = '', title = '', description = '' }: Props = $props();

  function getCourseUrl() {
    return `/course/${slug}`;
  }
</script>

<div
  class="h-fit w-full min-w-[250px] max-w-[320px] cursor-pointer space-y-4 md:min-w-[200px] md:max-w-[300px]"
>
  <div
    class="relative space-y-4 rounded-sm border border-[#282828] px-2 py-2 hover:bg-[#282828] {className} shadow"
  >
    <div class="overflow-hidden rounded-md">
      <img
        src={bannerImage ? bannerImage : '/course-banner.jpg'}
        alt=""
        class="h-44 w-full object-cover"
      />
      <div class="overflow-hidden py-4">
        <p class="line-clamp-1 overflow-ellipsis text-lg font-semibold">
          {title}
        </p>
      </div>
      <p class="line-clamp-3 overflow-ellipsis text-justify text-[#ABABAB]">
        {description}
      </p>
    </div>
    <PrimaryButton
      href={getCourseUrl()}
      class="w-full rounded border border-white bg-transparent text-white hover:bg-white hover:text-black"
      label="Go to Course"
    />
  </div>
</div>
