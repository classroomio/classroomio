<script lang="ts">
  import { ArrowRight } from 'carbon-icons-svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { COURSE_TYPE } from '$lib/utils/types';
  export let isLearningPath = false;
  export let className = '';
  export let buttonClass = '';
  export let bannerImage: string | undefined;

  export let slug = '';
  export let title = '';
  export let description = '';

  export let cost = 0;

  export let currency = 'USD';

  function getCourseUrl() {
    return isLearningPath ? `/pathway/${slug}` : `/course/${slug}`;
  }
</script>

<div class="h-fit w-full min-w-[250px] md:min-w-[300px] max-w-[300px] space-y-4">
  <div class="border border-[#EAEAEA] rounded-sm space-y-4 p-4 {className} bg-[#FDFDFD] w-full">
    <div class="flex items-center justify-between">
      <p class="text-lg font-normal capitalize w-[60%] line-clamp-1">{title}</p>
      {#if isLearningPath}
        <ArrowRight size={24} />
      {/if}
    </div>

    <div class="rounded-sm overflow-hidden">
      <img
        src={bannerImage ? bannerImage : '/images/classroomio-course-img-template.jpg'}
        alt=""
        class="w-full h-44"
      />
    </div>
    {#if !isLearningPath}
      <a href={getCourseUrl()}>
        <div
          class="uppercase font-medium mt-4 text-start w-full bg-[#00E577] rounded-sm p-3 cursor-pointer hover:no-underline hover:scale-90 transition-all duration-200 {buttonClass}"
        >
          Register here
        </div>
      </a>
    {/if}
  </div>
</div>
