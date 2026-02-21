<script lang="ts">
  import { untrack } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Progress } from '@cio/ui/base/progress';
  import RocketIcon from '@lucide/svelte/icons/rocket';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { PricingCard } from '@cio/ui/custom/pricing-card';
  import { PricingToggle } from '@cio/ui/custom/pricing-toggle';

  import { PLANS } from '@cio/utils/plans';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { toggleConfetti } from './confetti/store';
  import { currentOrg, currentOrgPath, isFreePlan } from '$lib/utils/store/org';
  import Confetti from './confetti/confetti.svelte';

  const planNames = Object.keys(PLANS);

  let isLoadingPlan: string | null = $state(null);
  let upgraded = $state(false);
  let isYearlyPlan = $state(false);

  const query = $derived(new URLSearchParams(page.url.search));
  let open = $state(false);
  let isConfirming = $derived((query.get('confirmation') || '') === 'true');

  $effect(() => {
    open = (query.get('upgrade') || '') === 'true';
  });

  async function handleClick(plan, planName: string) {
    if (plan.CTA.IS_DISABLED || !$profile.id || !$profile.email) {
      return;
    }

    if (!plan.CTA.PRODUCT_ID && plan.CTA.DASHBOARD_LINK) {
      window.open(plan.CTA.DASHBOARD_LINK, '_blank');
      return;
    }

    isLoadingPlan = planName;

    try {
      const checkoutURL = new URL('/api/polar/subscribe', page.url);

      checkoutURL.searchParams.set('productId', isYearlyPlan ? plan.CTA.PRODUCT_ID_YEARLY : plan.CTA.PRODUCT_ID);
      checkoutURL.searchParams.set('customerEmail', $profile.email);
      checkoutURL.searchParams.set('customerName', $profile.fullname);
      checkoutURL.searchParams.set(
        'metadata',
        JSON.stringify({
          triggeredBy: $currentOrg.roleId,
          orgId: $currentOrg.id,
          orgSlug: $currentOrg.siteName
        })
      );

      window.location.href = checkoutURL.toString();
    } catch (error) {
      console.error('Error subscribing', error);

      snackbar.error('snackbar.upgrade.failed');
    }

    isLoadingPlan = null;
  }

  function onUpgrade() {
    untrack(() => {
      upgraded = true;
    });
    toggleConfetti();

    setTimeout(() => {
      toggleConfetti();
    }, 1000);
  }

  function onClose() {
    const path = upgraded ? $currentOrgPath : page.url.pathname;
    goto(path);
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      onClose();
    }
  }

  function onLearnMore() {
    window.open('https://classroomio.com/blog/early-adopter', '_blank');
  }

  function handleUpgradeSuccess(upgradeSuccessful: boolean) {
    if (upgradeSuccessful) {
      onUpgrade();
    }
  }

  $effect(() => {
    handleUpgradeSuccess(Boolean($currentOrg.id && !$isFreePlan && open));
  });
</script>

{#if upgraded}
  <Confetti />
{/if}

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-5xl! {upgraded || isConfirming ? 'max-w-[600px]!' : ''}">
    <Dialog.Header>
      <Dialog.Title>{$t('pricing.modal.heading')}</Dialog.Title>
    </Dialog.Header>
    {#if upgraded}
      <div class="animate-icon flex w-full flex-col items-center justify-center gap-4">
        <RocketIcon class="rocket-launch my-3 size-6" color="var(--primary)" />
        <p class="text-lg">{$t('pricing.modal.thanks')}</p>
        <p class="ui:mb-4 ui:text-center">
          {$t('pricing.modal.plan')}
        </p>
        <div class="flex items-center gap-4">
          <Button variant="outline" onclick={onClose}>
            {$t('pricing.modal.close')}
          </Button>
          <Button variant="default" onclick={onLearnMore}>
            {$t('pricing.modal.learn')}
          </Button>
        </div>
      </div>
    {:else if isConfirming}
      <div class="items-center">
        <div class="flex w-full flex-col items-center justify-center py-8">
          <Progress />
        </div>
      </div>
    {:else}
      <div class="flex h-full flex-col items-center justify-center">
        <div class="ui:mb-6">
          <PricingToggle
            bind:isYearly={isYearlyPlan}
            monthlyLabel={$t('pricing.modal.monthly')}
            yearlyLabel={$t('pricing.modal.annually')}
            saveLabel={$t('pricing.modal.save')}
          />
        </div>
        <div class="mt-6 grid w-full grid-cols-1 gap-6 overflow-y-auto p-2 md:grid-cols-3 md:overflow-y-visible">
          {#each planNames as planName}
            {@const plan = PLANS[planName]}
            {@const isPopular = planName === 'EARLY_ADOPTER'}
            <PricingCard
              {plan}
              {planName}
              {isPopular}
              {isYearlyPlan}
              {isLoadingPlan}
              {handleClick}
              popularLabel={$t('pricing.modal.popular')}
              perOrgLabel={$t('pricing.modal.per_org')}
            />
          {/each}
        </div>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
