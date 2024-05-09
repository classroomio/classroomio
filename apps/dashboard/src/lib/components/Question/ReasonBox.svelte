<script>
  import { VARIANTS } from '../PrimaryButton/constants';
  import GradeLoader from './GradeLoader.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

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
        label="Accept"
        className="rounded-none py-1 px-2"
        disablePadding={true}
        onClick={acceptGrade}
      />
      <PrimaryButton
        variant={VARIANTS.CONTAINED_DANGER}
        label="Reject"
        className="rounded-none py-1 px-2"
        disablePadding={true}
        onClick={rejectGrade}
      />
    </div>
  </div>
{/if}
