<script>
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Audience from '$lib/components/Org/Audience/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { orgAudience, currentOrgPlan, currentOrgMaxAudience } from '$lib/utils/store/org';
  import { PLAN } from 'shared/src/plans/constants';
  import UpgradeBanner from '$lib/components/Upgrade/Banner.svelte';

  let isLoading = $state(false);

  function exportAudience() {
    isLoading = true;
    alert('This feature is coming soon');
    isLoading = false;
  }
</script>

<svelte:head>
  <title>Audience - ClassroomIO</title>
</svelte:head>

<section class="mx-auto w-full max-w-4xl">
  <div class="px-5 py-10">
    <div class="mb-10 flex items-center justify-between">
      <div class="flex items-end">
        <h1 class="m-0 text-2xl font-bold md:text-3xl dark:text-white">{$t('audience.title')}</h1>
        {#if $currentOrgPlan?.plan_name !== PLAN.ENTERPRISE}
          <span class="ml-2">
            ({$orgAudience.length} / {$currentOrgMaxAudience})
          </span>
        {/if}
      </div>
      <PrimaryButton label={$t('audience.export')} onClick={exportAudience} isDisabled={isLoading} {isLoading} />
    </div>

    {#if $orgAudience.length >= $currentOrgMaxAudience}
      <UpgradeBanner>{$t('audience.upgrade')}</UpgradeBanner>
    {/if}
    <Audience />
  </div>
</section>
