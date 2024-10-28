<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/button/button.svelte';

  export let className = '';
  export let bannerImage: string | undefined;
  export let slug = '';
  export let title = '';
  export let description = '';

  function getCourseUrl() {
    return `/course/${slug}`;
  }
</script>

<div class="h-fit w-full min-w-[250px] md:min-w-[300px] max-w-full sm:max-w-[280px] space-y-4">
  <div class="border dark:border-[#EAEAEA] rounded-sm space-y-4 px-2 py-2 {className} shadow">
    <div class="rounded-md overflow-hidden">
      <img
        src={bannerImage ? bannerImage : '/classroomio-course-img-template.jpg'}
        alt=""
        class="w-full h-44"
      />
      <div class="py-4 overflow-hidden">
        <p class="text-lg font-semibold overflow-ellipsis line-clamp-1">
          {title}
        </p>
      </div>
      <p class=" text-black dark:text-[#ABABAB] overflow-ellipsis line-clamp-3 text-justify">
        {description}
      </p>
    </div>
    <Button
      on:click={() => goto(getCourseUrl())}
      class="bg-transparent hover:bg-white hover:text-black hover:dark:text-black dark:text-white text-black border border-black dark:border-white  w-full"
      >Go to Course</Button
    >
  </div>
</div>
