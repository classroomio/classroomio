<script lang="ts">
  import { goto } from '$app/navigation';
  import ShineBorder from '$lib/components/ui/shinyborder/ShineBorder.svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import defaultBanner from './assets/classroomio-course-img-template.jpg';
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

<ShineBorder color={['#0233BD', '#C1D4FF', '#93B4FF']}>
  <div
    class="cursor-pointer h-fit w-full min-w-[250px] md:min-w-[200px] max-w-[320px] md:max-w-[300px] space-y-4"
  >
    <div
      class="border relative border-[#282828] hover:bg-[#282828] rounded-sm space-y-4 px-2 py-2 {className} shadow"
    >
      <div class="rounded-md overflow-hidden">
        <img
          src={bannerImage ? bannerImage : defaultBanner}
          alt=""
          class="w-full h-44 object-cover"
        />
        <div class="py-4 overflow-hidden">
          <p class="text-lg font-semibold overflow-ellipsis line-clamp-1">
            {title}
          </p>
        </div>
        <p class=" text-[#ABABAB] overflow-ellipsis line-clamp-3 text-justify">
          {description}
        </p>
      </div>
      <PrimaryButton
        href={getCourseUrl()}
        class="bg-transparent hover:text-black hover:bg-white text-white border border-white w-full rounded"
        label="Go to Course"
      />
    </div>
  </div>
</ShineBorder>
