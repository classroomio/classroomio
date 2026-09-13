<script lang="ts">
  import { untrack } from 'svelte';
  import { page } from '$app/state';
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
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import {
    UPGRADE_CONFIRMATION_PARAM,
    UPGRADE_PARAM,
    clearUpgradeSearchParams,
    closeUpgradeModal,
    isUpgradeModalOpen,
    openUpgradeModal,
    runUpgradeCheckoutHandoffs
  } from '$lib/utils/store/upgrade-modal';
  import Confetti from './confetti/confetti.svelte';

  const planNames = Object.keys(PLANS);

  let isLoadingPlan: string | null = $state(null);
  let upgraded = $state(false);
  let isYearlyPlan = $state(false);
  let isConfirming = $state(false);
  let handledUpgradeParamFor: string | null = null;

  // Billing emails and the post-checkout return URL open the modal with `?upgrade=true`.
  // The params are consumed once here so that closing the modal never has to navigate.
  $effect(() => {
    const currentHref = page.url.href;
    if (page.url.searchParams.get(UPGRADE_PARAM) !== 'true') return;
    if (handledUpgradeParamFor === currentHref) return;

    untrack(() => {
      handledUpgradeParamFor = currentHref;
      isConfirming = page.url.searchParams.get(UPGRADE_CONFIRMATION_PARAM) === 'true';
      clearUpgradeSearchParams();
      openUpgradeModal();
    });
  });

  async function handleClick(plan, planName: string) {
    if (plan.CTA.IS_DISABLED || !$profile.id || !$profile.email || !$currentOrg.memberId) {
      return;
    }

    if (!plan.CTA.PRODUCT_ID && plan.CTA.DASHBOARD_LINK) {
      window.open(plan.CTA.DASHBOARD_LINK, '_blank');
      return;
    }

    isLoadingPlan = planName;

    try {
      // Checkout unloads the page, so editors holding unsaved work stash it first.
      runUpgradeCheckoutHandoffs();

      // Read the address bar rather than `page.url`: shallow routing leaves `page.url`
      // holding upgrade params that were already stripped from the URL.
      const returnTo = `${window.location.pathname}${window.location.search}`;
      const productId = isYearlyPlan ? plan.CTA.PRODUCT_ID_YEARLY : plan.CTA.PRODUCT_ID;
      const checkoutURL = new URL('/api/polar/subscribe', window.location.origin);

      checkoutURL.searchParams.set('products', productId);
      checkoutURL.searchParams.set('orgId', $currentOrg.id);
      checkoutURL.searchParams.set('returnTo', returnTo);

      requestAnimationFrame(() => {
        window.location.href = checkoutURL.toString();
      });
    } catch (error) {
      isLoadingPlan = null;
      console.error('Error subscribing', error);

      snackbar.error('snackbar.upgrade.failed');
    }
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

  function handleClose() {
    isConfirming = false;
    upgraded = false;
    isLoadingPlan = null;
    closeUpgradeModal();
  }

  function handleOpenChange(newOpen: boolean) {
    if (newOpen) return;

    handleClose();
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
    handleUpgradeSuccess(Boolean($currentOrg.id && !$isFreePlan && $isUpgradeModalOpen));
  });
</script>

{#if upgraded}
  <Confetti />
{/if}

<Dialog.Root open={$isUpgradeModalOpen} onOpenChange={handleOpenChange}>
  <Dialog.Content
    class="top-[4dvh]! max-h-[92dvh] w-[96vw] translate-y-0! overflow-y-auto p-4 sm:top-[50%]! sm:max-h-[92dvh] sm:translate-y-[-50%]! sm:p-6 {upgraded ||
    isConfirming
      ? 'max-w-[min(600px,96vw)]!'
      : 'max-w-5xl!'}"
  >
    <Dialog.Header>
      <Dialog.Title>{$t('pricing.modal.heading')}</Dialog.Title>
    </Dialog.Header>
    {#if upgraded}
      <div class="animate-icon flex w-full flex-col items-center justify-center gap-4 px-1">
        <RocketIcon class="rocket-launch my-3 size-6" color="var(--primary)" />
        <p class="text-center text-lg">{$t('pricing.modal.thanks')}</p>
        <p class="mb-4 text-center">
          {$t('pricing.modal.plan')}
        </p>
        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Button class="w-full sm:w-auto" variant="outline" onclick={handleClose}>
            {$t('pricing.modal.close')}
          </Button>
          <Button class="w-full sm:w-auto" variant="default" onclick={onLearnMore}>
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
      <div class="flex flex-col items-center">
        <div class="mb-4 w-full max-w-sm px-2 sm:mb-6 sm:max-w-none sm:px-4">
          <PricingToggle
            bind:isYearly={isYearlyPlan}
            monthlyLabel={$t('pricing.modal.monthly')}
            yearlyLabel={$t('pricing.modal.annually')}
            saveLabel={$t('pricing.modal.save')}
          />
        </div>
        <div class="grid w-full grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
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
              className="w-full max-w-none!"
              popularLabel={$t('pricing.modal.popular')}
              perOrgLabel={$t('pricing.modal.per_org')}
            />
          {/each}
        </div>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
