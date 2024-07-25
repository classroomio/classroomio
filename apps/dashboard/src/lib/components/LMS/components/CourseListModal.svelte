<script>
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import Modal from '$lib/components/Modal/index.svelte';

  export let open = false;
  export let mockPathway;

  const getCourseUrl = () => {
    return '#';
  };
</script>

<Modal
  onClose={() => (open = false)}
  width="w-4/5 md:w-2/5 h-[70%]"
  modalHeading="PATHWAY: {mockPathway.title}"
  labelClass="w-[80%] truncate text-xs font-semibold"
  containerClass="py-4 h-[70%]"
  buttonClass="flex justify-end"
  bind:open
>
  <div class="h-full">
    {#each mockPathway.courses as course}
      <a href={getCourseUrl()} class="hover:no-underline">
        <div class="p-2 cursor-pointer space-y-2 {NavClasses.item}">
          <p class="text-sm font-normal w-[60%] truncate">{course.title}</p>
          {#if course.isLocked}
            <p class="text-sm font-normal text-gray-500 bg-gray-300 w-fit px-1 rounded-sm">
              Locked
            </p>
          {:else}
            <div class="flex items-center gap-2">
              <div class="relative bg-[#EAEAEA] w-[40%] h-2">
                <div
                  style="width: {course.course_progress}%"
                  class="absolute top-0 left-0 bg-primary-900 h-full"
                />
              </div>
              <p class="text-xs font-medium">
                {course.course_progress === 100 ? 'Completed' : `${course.course_progress}%`}
              </p>
            </div>
          {/if}
        </div>
      </a>
    {/each}
  </div>

  <!-- Button -->
  <div slot="buttons">
    <PrimaryButton
      label="Go to Pathway"
      variant={VARIANTS.TEXT}
      className="text-primary-800 font-semibold"
    />
  </div>
</Modal>
