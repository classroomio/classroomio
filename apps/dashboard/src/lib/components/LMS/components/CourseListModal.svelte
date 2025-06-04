<script lang="ts">
  import { goto } from '$app/navigation';
  import Modal from '$lib/components/Modal/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import { courseProgress } from '$lib/utils/functions/pathway';
  import { t } from '$lib/utils/functions/translations';
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
  {#if pathway.pathway_course?.length > 0}
    <div class="h-full">
      {#each pathway.pathway_course as pathway_course}
        <a
          href={pathway_course?.is_unlocked && pathway_course?.course?.is_published
            ? `/courses/${pathway_course?.course?.id}`
            : null}
          class="hover:no-underline"
        >
          <div class="cursor-pointer space-y-2 p-2 {NavClasses.item}">
            <p class="w-[60%] truncate text-sm font-normal">{pathway_course?.course?.title}</p>
            {#if pathway_course?.is_unlocked == false || pathway_course?.course?.is_published == false}
              <p class="w-fit rounded-sm bg-gray-300 px-1 text-sm font-normal text-gray-500">
                {$t('lms_pathway.locked')}
              </p>
            {:else}
              <div class="flex items-center gap-2">
                <div class="relative h-2 w-[40%] bg-[#EAEAEA]">
                  <div
                    style="width: {courseProgress(pathway_course?.course?.lesson) || 0}%"
                    class="bg-primary-900 absolute left-0 top-0 h-full"
                  />
                </div>
                <p class="text-xs font-medium">
                  {courseProgress(pathway_course?.course?.lesson) === 100
                    ? `${$t('lms_pathway.completed')}`
                    : `${courseProgress(pathway_course?.course?.lesson) || 0}%`}
                </p>
              </div>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  {:else}
    <h3 class="my-5 text-2xl dark:text-white">{$t('search.no_course')}</h3>
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
