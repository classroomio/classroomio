<script>
  import { Grid, Row, Column } from 'carbon-components-svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { currentOrgPlan, isFreePlan } from '$lib/utils/store/org';
  import SectionTitle from '../SectionTitle.svelte';
  import { t } from '$lib/utils/functions/translations';

  let isRedirecting = false;

  async function onOpenBilling() {
    console.log({
      plan: $currentOrgPlan
    });

    if ($currentOrgPlan?.subscriptionId) {
      isRedirecting = true;
      fetch('/api/lmz/subscriptions?subscriptionId=' + $currentOrgPlan?.subscriptionId)
        .then((response) => response.json())
        .then((res) => {
          isRedirecting = false;
          window.open(res.customerPortal, '_blank');
        });
    }
  }
</script>

<Grid class="border-c rounded border-gray-200 dark:border-neutral-600 w-full mt-5">
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4}
      ><SectionTitle>{$t('settings.billing.sub_title')}</SectionTitle></Column
    >
    <Column sm={8} md={8} lg={8}>
      <h4 class="dark:text-white lg:mt-0">{$t('settings.billing.manage')}</h4>
      {#if $isFreePlan}
        {$t('settings.billing.active')}
      {:else}
        <p class="mb-3">{$t('settings.billing.lemonsqueezy')}</p>

        <PrimaryButton
          label={$t('settings.billing.open_billing')}
          variant={VARIANTS.CONTAINED_DARK}
          onClick={onOpenBilling}
          isLoading={isRedirecting}
        />
      {/if}
    </Column>
  </Row>
</Grid>
