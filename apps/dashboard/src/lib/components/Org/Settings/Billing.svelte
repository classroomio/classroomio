<script>
  import { Grid, Row, Column } from 'carbon-components-svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { currentOrgPlan, isFreePlan } from '$lib/utils/store/org';
  import SectionTitle from '../SectionTitle.svelte';

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
    <Column sm={4} md={4} lg={4}><SectionTitle>Billing details</SectionTitle></Column>
    <Column sm={8} md={8} lg={8}>
      <h4 class="dark:text-white lg:mt-0">Manage your billing</h4>
      {#if $isFreePlan}
        You don't have any active billing
      {:else}
        <p class="mb-3">We use Lemonsqueezy to help manage your billing</p>

        <PrimaryButton
          label="Open billing"
          variant={VARIANTS.CONTAINED_DARK}
          onClick={onOpenBilling}
          isLoading={isRedirecting}
        />
      {/if}
    </Column>
  </Row>
</Grid>
