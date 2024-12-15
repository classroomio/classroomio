<script lang="ts">
  import PrimaryButton from './PrimaryButton.svelte';

  interface Props {
    className?: string;
    bannerImage: string | undefined;
    slug: string;
    title: string;
    description: string;
  }

  let { className = '', bannerImage, slug = '', title = '', description = '' }: Props = $props();
</script>

<div
  class="h-full w-full min-w-[80%] max-w-full space-y-4 overflow-hidden rounded-xl border-2 border-black bg-white pb-2 md:min-w-[300px] md:max-w-[350px]"
>
  <div class="relative space-y-2 text-black {className}">
    <div class="border-b-2 border-dashed border-black">
      <img src={bannerImage || '/classroomio-course-img-template.jpg'} alt="" class="h-44 w-full" />
    </div>
    <div>
      <div class="overflow-hidden px-3 py-2">
        <p class="line-clamp-1 overflow-ellipsis text-lg font-semibold">
          {title}
        </p>
      </div>
      <p class="line-clamp-3 overflow-ellipsis px-3 text-justify text-sm text-[#656565]">
        {description}
      </p>
    </div>

    <div class=" w-full px-6 py-4">
      <PrimaryButton href={`/course/${slug}`} label="Go to Course" />
    </div>
  </div>
</div>
