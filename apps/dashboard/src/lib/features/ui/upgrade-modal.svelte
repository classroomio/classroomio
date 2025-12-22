<script lang="ts">
  import { untrack } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Progress } from '@cio/ui/base/progress';
  import CheckIcon from '@lucide/svelte/icons/check';
  import RocketIcon from '@lucide/svelte/icons/rocket';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';

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
  let isYearlyPlan = $state(true);

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
        <div class="white 0 relative mb-6 flex items-center rounded-full border p-1">
          <Button
            variant={isYearlyPlan ? 'ghost' : 'secondary'}
            size="sm"
            class="rounded-full! transition-all duration-500 ease-in-out "
            onclick={() => (isYearlyPlan = false)}
          >
            {$t('pricing.modal.monthly')}
          </Button>
          <Button
            variant={isYearlyPlan ? 'secondary' : 'ghost'}
            size="sm"
            class="rounded-full! transition-all duration-500 ease-in-out"
            onclick={() => (isYearlyPlan = true)}
          >
            {$t('pricing.modal.annually')}
          </Button>
          <Badge variant="default" class="rotate-5 absolute -top-3 right-[-20%] shadow-2xl">
            <SparklesIcon class="text-amber-500! size-2" />
            {$t('pricing.modal.save')}
          </Badge>
        </div>
        <div class="grid w-full grid-cols-1 gap-6 overflow-y-auto p-2 md:grid-cols-3 md:overflow-y-visible">
          {#each planNames as planName}
            {@const plan = PLANS[planName]}
            {@const isPopular = planName === 'EARLY_ADOPTER'}
            <div
              class="relative flex max-w-sm flex-col rounded-lg p-6 {isPopular ? 'animate-gradient-border' : 'border '}"
            >
              {#if isPopular}
                <Badge
                  variant="default"
                  class="bg-linear-to-r absolute -top-3 left-1/2 -translate-x-1/2 from-pink-500 to-orange-500"
                >
                  Popular
                </Badge>
              {/if}
              <div class="mb-4">
                <h3 class="mb-2 text-lg font-semibold">
                  {plan?.NAME}
                </h3>
                <div class="mb-1 flex items-baseline gap-1">
                  <span class="text-xl">
                    {plan?.PRICE?.CURRENCY}
                    {isYearlyPlan ? plan?.PRICE?.YEARLY : plan?.PRICE?.MONTHLY}
                  </span>
                </div>
                <p class="text-sm text-gray-500">Per Organization</p>
              </div>

              <Button
                variant={isPopular ? 'default' : 'outline'}
                class="mb-6 w-full"
                disabled={plan?.CTA?.IS_DISABLED || isLoadingPlan === planName}
                loading={isLoadingPlan === planName}
                onclick={() => {
                  if (isLoadingPlan === planName) return;
                  handleClick(plan, planName);
                }}
              >
                {plan?.CTA?.DASHBOARD_LABEL}
              </Button>

              <ul class="space-y-3">
                {#each plan?.FEATURES as feature}
                  <li class="flex items-start gap-2">
                    <CheckIcon class="mt-0.5 size-4 shrink-0" />
                    <span class="text-sm leading-relaxed">
                      {feature}
                    </span>
                  </li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
