<script>
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Audience from '$lib/components/Org/Audience/index.svelte';
  import { orgAudience, currentOrgPlan, currentOrgMaxAudience } from '$lib/utils/store/org';
  import { PLAN } from 'shared-constants/src/plans/constants';
  import UpgradeBanner from '$lib/components/Upgrade/Banner.svelte';

  let isLoading = false;

  function exportAudience() {
    isLoading = true;
    alert('This feature is coming soon');
    isLoading = false;
  }
</script>

<svelte:head>
  <title>Audience - ClassroomIO</title>
</svelte:head>

<section class="w-full max-w-4xl mx-auto">
  <div class="py-10 px-5">
    <div class="flex items-center justify-between mb-10">
      <div class="flex items-end">
        <h1 class="dark:text-white text-2xl md:text-3xl font-bold m-0">Audience</h1>
        {#if $currentOrgPlan?.plan_name !== PLAN.ENTERPRISE}
          <span class="ml-2">
            ({$orgAudience.length} / {$currentOrgMaxAudience})
          </span>
        {/if}
      </div>
      <PrimaryButton label="Export" onClick={exportAudience} isDisabled={isLoading} {isLoading} />
    </div>

    {#if $orgAudience.length >= $currentOrgMaxAudience}
      <UpgradeBanner>Upgrade your plan to invite more students</UpgradeBanner>
    {/if}
    <Audience />
  </div>
</section>
