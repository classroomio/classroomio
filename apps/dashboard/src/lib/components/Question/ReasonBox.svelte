<script>
  import { VARIANTS } from '../PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';

  export let reason = '';
  export let isLoading = false;
  export let rejectGrade = () => {};
  export let acceptGrade = () => {};
</script>

<div class="border rounded-md">
  {#if isLoading}
    <div class="flex w-full px-2 py-4">
      <div class="w-full flex flex-row items-start space-x-4">
        <img src="/ai.svg" alt="alt" class="animate-pulse" />
        <div class="w-full">
          <SkeletonText width="100%" paragraph lines={3} />
        </div>
      </div>
      <div class="flex space-x-2">
        <SkeletonPlaceholder style="height: 2rem; width: 5rem;" />
        <SkeletonPlaceholder style="height: 2rem; width: 5rem;" />
      </div>
    </div>
  {:else}
    <div class="flex items-start justify-between px-2 py-4">
      <div class="flex items-center space-x-4">
        <img src="/ai.svg" alt="alt" />
        <p class="font-normal text-sm">
          {reason}
        </p>
      </div>
      <div class="flex space-x-2">
        <PrimaryButton
          variant={VARIANTS.CONTAINED_SUCCESS}
          label={$t('course.navItem.submissions.grading_modal.accept_grade')}
          className="rounded-none py-1 px-2"
          disablePadding={true}
          onClick={acceptGrade}
        />
        <PrimaryButton
          variant={VARIANTS.CONTAINED_DANGER}
          label={$t('course.navItem.submissions.grading_modal.reject_grade')}
          className="rounded-none py-1 px-2"
          disablePadding={true}
          onClick={rejectGrade}
        />
      </div>
    </div>
  {/if}
</div>
