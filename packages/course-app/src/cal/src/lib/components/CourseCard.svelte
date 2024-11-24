<script lang="ts">
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/shared/PrimaryButton.svelte';

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
  class="bg-white border-2 border-black rounded-xl overflow-hidden cursor-pointer h-fit w-full pb-2 min-w-[250px] md:min-w-[300px] max-w-full sm:max-w-[280px] space-y-4"
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
      <div class="px-6 py-4 overflow-hidden">
        <p class="text-lg font-semibold overflow-ellipsis line-clamp-1">
          {title}
        </p>
      </div>
      <p class="text-sm text-[#656565] px-6 overflow-ellipsis line-clamp-3 text-justify">
        {description}
      </p>
    </div>

    <div class=" w-full py-4 px-6">
      <PrimaryButton
        href={`/course/${slug}`}
        label="Go to Course"
      />
    </div>
  </div>
</div>
