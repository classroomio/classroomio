<script>
  import { VARIANTS } from '../PrimaryButton/constants';
  import GradeLoader from './GradeLoader.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';

  export let reason = '';
  export let isLoading = false;
  export let rejectGrade = () => {};
  export let acceptGrade = () => {};
</script>

{#if isLoading}
  <GradeLoader />
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
