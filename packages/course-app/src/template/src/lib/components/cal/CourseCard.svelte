<script lang="ts">
  import PrimaryButton from './PrimaryButton.svelte';

  interface Props {
    className?: string;
    bannerImage: string | undefined;
    slug: string;
    title: string;
    description: string;
  }

  let {
    className = '',
    bannerImage = '',
    slug = '',
    title = '',
    description = ''
  }: Props = $props();
</script>

<div
  class="bg-white border-2 border-black rounded-xl overflow-hidden w-full h-full pb-2 min-w-[80%] md:max-w-[350px] md:min-w-[300px] max-w-full space-y-4"
>
  <div class="relative space-y-2 text-black {className}">
    <div class="border-b-2 border-black border-dashed">
      <img
        src={bannerImage ? bannerImage : '/classroomio-course-img-template.jpg'}
        alt=""
        class="w-full h-44"
      />
    </div>
    <div>
      <div class="px-3 py-2 overflow-hidden">
        <p class="text-lg font-semibold overflow-ellipsis line-clamp-1">
          {title}
        </p>
      </div>
      <p class="text-sm text-[#656565] px-3 overflow-ellipsis line-clamp-3 text-justify">
        {description}
      </p>
    </div>

    <div class=" w-full py-4 px-6">
      <PrimaryButton href={`/course/${slug}`} label="Go to Course" />
    </div>
  </div>
</div>
