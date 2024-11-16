<script>
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Audience from '$lib/components/Org/Audience/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { orgAudience, currentOrgPlan, currentOrgMaxAudience, currentOrg } from '$lib/utils/store/org';
  import { exportOrgAudience } from '$lib/utils/services/org';
  import { PLAN } from 'shared/src/plans/constants';
  import UpgradeBanner from '$lib/components/Upgrade/Banner.svelte';

  let isLoading = false;

  async function exportAudience() {
    isLoading = true;

    try {
      const csvUrl = await exportOrgAudience({ orgId: $currentOrg.id });

      const link = document.createElement('a');
      link.href = csvUrl;
      link.download = 'students.csv';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(csvUrl);
    } catch (error) {
      alert("An error occurred. Please try again later.");
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Audience - ClassroomIO</title>
</svelte:head>

<section class="w-full max-w-4xl mx-auto">
  <div class="py-10 px-5">
    <div class="flex items-center justify-between mb-10">
      <div class="flex items-end">
        <h1 class="dark:text-white text-2xl md:text-3xl font-bold m-0">{$t('audience.title')}</h1>
        {#if $currentOrgPlan?.plan_name !== PLAN.ENTERPRISE}
          <span class="ml-2">
            ({$orgAudience.length} / {$currentOrgMaxAudience})
          </span>
        {/if}
      </div>
      <PrimaryButton
        label={$t('audience.export')}
        onClick={exportAudience}
        isDisabled={isLoading}
        {isLoading}
      />
    </div>

    {#if $orgAudience.length >= $currentOrgMaxAudience}
      <UpgradeBanner>{$t('audience.upgrade')}</UpgradeBanner>
    {/if}
    <Audience />
  </div>
</section>
