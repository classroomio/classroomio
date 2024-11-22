<script lang="ts">
  import { goto } from '$app/navigation';

  import Button from '$lib/components/ui/button/button.svelte';

  interface Props {
    className?: string;
    bannerImage?: string | undefined;
    slug?: string;
    title?: string;
    description?: string;
  }

  let {
    className = '',
    bannerImage = '',
    slug = '',
    title = '',
    description = ''
  }: Props = $props();

  function getCourseUrl() {
    return `/course/${slug}`;
  }
</script>

<div
  class="bg-white rounded-lg overflow-hidden cursor-pointer h-fit w-full pb-2 min-w-[250px] md:min-w-[300px] max-w-full sm:max-w-[280px] space-y-4"
>
  <div class="relative space-y-2 text-black {className}">
    <div>
      <img
        src={bannerImage ? bannerImage : '/classroomio-course-img-template.jpg'}
        alt=""
        class="w-full h-44"
      />
      <div class="px-6 py-4 overflow-hidden">
        <p class="text-lg font-semibold overflow-ellipsis line-clamp-1">
          {title}
        </p>
      </div>
      <p class="text-sm text-[#656565] px-6 overflow-ellipsis line-clamp-3 text-justify">
        {description}
      </p>
    </div>
    <div class="flex items-center justify-center w-full py-4 px-6">
      <Button
        on:click={() => goto(getCourseUrl())}
        class="uppercase rounded-full bg-[#0233BD] border-[1.5px] border-[#141414] text-white shadow-[0px_3px_#141414] w-full "
        >Go to Course</Button
      >
    </div>
  </div>
</div>
