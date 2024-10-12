<script lang="ts">
  import { ArrowRight } from 'carbon-icons-svelte';
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
  <div class="border border-[#EAEAEA] rounded-sm space-y-4 px-4 {className}">
    <p class="text-xl font-semibold py-4 border-b border-[#EAEAEA]">{title}</p>
    <div class="rounded-md overflow-hidden">
      {#if isLearningPath}
        <img
          src={bannerImage ? bannerImage : '/classroomio-course-img-template.jpg'}
          alt=""
          class="w-full h-44"
        />
      {:else}
        <p class=" text-[#878787] overflow-ellipsis line-clamp-6 text-justify">
          {description}
        </p>
      {/if}
    </div>

    <span class="flex justify-between items-center py-4">
      <p>8 {isLearningPath ? 'Courses' : 'Lessons'}</p>
      <p class="font-bold text-[#0233BD]">{currency == 'USD' ? '$' : 'N'}{cost}</p>
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
