<script lang="ts">
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import Modal from '$lib/components/Modal/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { goto } from '$app/navigation';
  import type { Pathway } from '$lib/utils/types';
  import { courseProgress } from '$lib/utils/functions/pathway';

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
  {#if pathway.pathway_course?.length > 0}
    <div class="h-full">
      {#each pathway.pathway_course as pathway_course}
        <a
          href={pathway_course.is_unlocked && pathway_course.course.is_published
            ? `/courses/${pathway_course.course.id}`
            : null}
          class="hover:no-underline"
        >
          <div class="p-2 cursor-pointer space-y-2 {NavClasses.item}">
            <p class="text-sm font-normal w-[60%] truncate">{pathway_course.course.title}</p>
            {#if pathway_course.is_unlocked == false || pathway_course.course.is_published == false}
              <p class="text-sm font-normal text-gray-500 bg-gray-300 w-fit px-1 rounded-sm">
                {$t('lms_pathway.locked')}
              </p>
            {:else}
              <div class="flex items-center gap-2">
                <div class="relative bg-[#EAEAEA] w-[40%] h-2">
                  <div
                    style="width: {courseProgress(pathway_course.course.lesson) || 0}%"
                    class="absolute top-0 left-0 bg-primary-900 h-full"
                  />
                </div>
                <p class="text-xs font-medium">
                  {courseProgress(pathway_course.course.lesson) === 100
                    ? `${$t('lms_pathway.completed')}`
                    : `${courseProgress(pathway_course.course.lesson) || 0}%`}
                </p>
              </div>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  {:else}
    <h3 class="dark:text-white text-2xl my-5">{$t('search.no_course')}</h3>
  {/if}
  <!-- Button -->
  <div slot="buttons">
    {#if pathway.pathway_course?.length > 0}
      <PrimaryButton
        label={$t('lms_pathway.goto_pathway')}
        variant={VARIANTS.TEXT}
        className="text-primary-800 font-semibold"
        onClick={gotoPathway}
      />
    {/if}
  </div>
</Modal>
