<script lang="ts">
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import Modal from '$lib/components/Modal/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { goto } from '$app/navigation';
  import type { Pathway } from '$lib/utils/types';

  export let open = false;
  export let pathway: Pathway | any;

  const gotoPathway = () => {
    return goto(`/pathways/${pathway.id}`);
  };
</script>

<Modal
  onClose={() => (open = false)}
  width="w-4/5 md:w-2/5 h-[70%]"
  modalHeading="{$t('lms_pathway.pathway')}: {pathway.title} "
  labelClass="w-[100%] truncate text-xs font-semibold"
  containerClass="py-4 h-[70%]"
  buttonClass="flex justify-end"
  bind:open
>
  <div class="h-full">
    {#each pathway.courses as course}
      <a href={course.is_unlocked ? `/course/${course.id}` : null} class="hover:no-underline">
        <div class="p-2 cursor-pointer space-y-2 {NavClasses.item}">
          <p class="text-sm font-normal w-[60%] truncate">{course.title}</p>
          {#if !course.is_unlocked}
            <p class="text-sm font-normal text-gray-500 bg-gray-300 w-fit px-1 rounded-sm">
              {$t('lms_pathway.locked')}
            </p>
          {:else}
            <div class="flex items-center gap-2">
              <div class="relative bg-[#EAEAEA] w-[40%] h-2">
                <div
                  style="width: {course.progress_rate}%"
                  class="absolute top-0 left-0 bg-primary-900 h-full"
                />
              </div>
              <p class="text-xs font-medium">
                {course.progress_rate === 100
                  ? `${$t('lms_pathway.completed')}`
                  : `${course.progress_rate}%`}
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
      label={$t('lms_pathway.goto_pathway')}
      variant={VARIANTS.TEXT}
      className="text-primary-800 font-semibold"
      onClick={gotoPathway}
    />
  </div>
</Modal>
