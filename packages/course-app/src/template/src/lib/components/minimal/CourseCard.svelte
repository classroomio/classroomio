<script lang="ts">
  import { ArrowRight } from 'carbon-icons-svelte';
  interface Props {
    isLearningPath?: boolean;
    className?: string;
    buttonClass?: string;
    bannerImage: string | undefined;
    slug?: string;
    title?: string;
    description?: string;
    cost?: number;
    currency?: string;
    lessons?: number;
  }

  let {
    isLearningPath = false,
    className = '',
    buttonClass = '',
    bannerImage,
    slug = '',
    title = '',
    description = '',
    cost = 0,
    currency = 'USD',
    lessons = 0
  }: Props = $props();
  function getCourseUrl() {
    return isLearningPath ? `/pathway/${slug}` : `/course/${slug}`;
  }
</script>

<div class="h-fit w-full min-w-[250px] max-w-[300px] space-y-4">
  <div class="border border-[#EAEAEA] rounded-sm space-y-4 px-4 {className}">
    <div class="py-4 border-b overflow-hidden">
      <p class="text-xl font-semibold p border-[#EAEAEA] overflow-ellipsis line-clamp-1">
        {title}
      </p>
    </div>
    <div class="rounded-md overflow-hidden">
      {#if isLearningPath}
        <img
          src={bannerImage ? bannerImage : '/classroomio-course-img-template.jpg'}
          alt=""
          class="w-full h-44"
        />
      {:else}
        <p class=" text-[#878787] overflow-ellipsis line-clamp-3 text-justify">
          {description}
        </p>
      {/if}
    </div>

    <span class="flex justify-between items-center py-4">
      <p>{lessons} {isLearningPath ? 'Courses' : 'Lessons'}</p>
      <p class="font-bold text-[#0233BD]">
        {!cost ? 'Free' : currency == 'USD' ? `$ ${cost}` : `N ${cost}`}
      </p>
    </span>
  </div>
  <a
    href={getCourseUrl()}
    class="flex items-center justify-between w-full border border-[#EAEAEA] rounded-sm p-3 cursor-pointer hover:no-underline hover:scale-90 transition-all duration-200 {buttonClass}"
  >
    <p class="font-bold text-[#0233BD] uppercase">Learn More</p>
    <ArrowRight class="text-[#0233BD]" />
  </a>
</div>
