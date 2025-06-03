<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Confetti from '$lib/components/Confetti/index.svelte';
  import { toggleConfetti } from '$lib/components/Confetti/store';

  import StepDoneIcon from '$lib/components/Icons/StepDoneIcon.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgPath, isFreePlan } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { Loading } from 'carbon-components-svelte';
  import Checkmark from 'carbon-icons-svelte/lib/Checkmark.svelte';
  import PLANS from 'shared/src/plans/data.json';

  const disabledClass = 'bg-gray-300 text-gray-400 hover:cursor-not-allowed';

  const planNames = Object.keys(PLANS);

  let isLoadingPlan: string | null = null;
  let open = false;
  let upgraded = false;
  let isYearlyPlan = false;
  let isConfirming = false;

  async function handleClick(plan, planName: string) {
    if (plan.CTA.IS_DISABLED || !$profile.id) {
      return;
    }

    if (!plan.CTA.PRODUCT_ID && plan.CTA.DASHBOARD_LINK) {
      window.open(plan.CTA.DASHBOARD_LINK, '_blank');
      return;
    }

    isLoadingPlan = planName;

    try {
      const checkoutURL = new URL('/api/polar/subscribe', $page.url);

      checkoutURL.searchParams.set(
        'productId',
        isYearlyPlan ? plan.CTA.PRODUCT_ID_YEARLY : plan.CTA.PRODUCT_ID
      );
      checkoutURL.searchParams.set('customerEmail', $profile.email);
      checkoutURL.searchParams.set('customerName', $profile.fullname);
      checkoutURL.searchParams.set(
        'metadata',
        JSON.stringify({
          triggeredBy: $currentOrg.memberId,
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
    upgraded = true;
    toggleConfetti();

    setTimeout(() => {
      toggleConfetti();
    }, 1000);
  }

  function onClose() {
    const path = upgraded ? $currentOrgPath : $page.url.pathname;
    goto(path);
  }

  function onLearnMore() {
    window.open('https://classroomio.com/blog/early-adopter', '_blank');
  }
  function toggleIsYearlyPlan() {
    isYearlyPlan = !isYearlyPlan;
  }

  $: {
    const query = new URLSearchParams($page.url.search);
    open = (query.get('upgrade') || '') === 'true';
    isConfirming = (query.get('confirmation') || '') === 'true';
  }

  $: handleUpgradeSuccess(Boolean($currentOrg.id && !$isFreePlan && open));
  function handleUpgradeSuccess(upgradeSuccessful: boolean) {
    if (upgradeSuccessful) {
      onUpgrade();
    }
  }
</script>

{#if upgraded}
  <Confetti />
{/if}

<Modal
  {onClose}
  {open}
  width="w-4/5"
  maxWidth={upgraded || isConfirming ? 'max-w-[600px]' : undefined}
  modalHeading={$t('pricing.modal.heading')}
  containerClass="pt-4"
>
  {#if upgraded}
    <div class="relative mb-4 flex w-full flex-col items-center justify-center">
      <StepDoneIcon />
      <h4 class="text-2xl">{$t('pricing.modal.thanks')}</h4>
      <p class="mb-4 text-center">
        {$t('pricing.modal.plan')}
      </p>
      <div class="flex items-center gap-4">
        <PrimaryButton
          label={$t('pricing.modal.close')}
          variant={VARIANTS.OUTLINED}
          onClick={onClose}
        />
        <PrimaryButton
          label={$t('pricing.modal.learn')}
          variant={VARIANTS.CONTAINED_DARK}
          onClick={onLearnMore}
        />
      </div>
    </div>
  {:else if isConfirming}
    <div class="relative mb-4 flex w-full flex-col items-center justify-center">
      <Loading withOverlay={false} />
    </div>
  {:else}
    <div class="flex flex-col items-center justify-center">
      <div class="relative mb-2 flex items-center rounded-[30px] border-[2px] p-[2px] lg:scale-100">
        <button
          style="background-color: {isYearlyPlan ? 'initial' : '#1D4EE2'}; color: {isYearlyPlan
            ? '#5e636b'
            : '#fff'}"
          class="rounded-[30px] bg-blue-700 px-3 py-1 text-xs text-white transition-all duration-500 ease-in-out lg:px-4 lg:py-2"
          on:click={toggleIsYearlyPlan}
        >
          {$t('pricing.modal.monthly')}
        </button>
        <button
          style="background-color: {isYearlyPlan ? '#1D4EE2' : ''}; color: {isYearlyPlan
            ? '#fff'
            : '#5e636b'}"
          class="relative rounded-[30px] px-3 py-1 text-xs text-white transition-all duration-500 ease-in-out lg:px-4 lg:py-2"
          on:click={toggleIsYearlyPlan}
        >
          {$t('pricing.modal.annually')}
          <div
            class="absolute -top-4 right-[-40%] scale-[90%] rounded-full bg-[#006600] px-1.5 py-1 text-[0.7rem] text-white"
          >
            {$t('pricing.modal.save')}
          </div>
        </button>
      </div>
      <div class="isolate grid grid-cols-1 gap-3 lg:grid-cols-3">
        {#each planNames as planName}
          <div
            class="max-w-xl rounded-xl {planName === 'EARLY_ADOPTER' &&
              'cio-bg-blue'} p-4 ring-1 ring-gray-200 lg:max-w-sm"
          >
            <p
              class="mb-2 text-lg font-semibold leading-8 {planName === 'EARLY_ADOPTER'
                ? 'text-white'
                : 'text-gray-900'} dark:text-white lg:text-xl"
            >
              {PLANS[planName].NAME}
            </p>
            <p
              class="text-baseline flex items-baseline gap-x-1 font-medium {planName ===
              'EARLY_ADOPTER'
                ? 'text-white'
                : 'text-black'} dark:text-gray-300"
            >
              {PLANS[planName].PRICE.CURRENCY}
              {isYearlyPlan ? PLANS[planName].PRICE.YEARLY : PLANS[planName].PRICE.MONTHLY}
            </p>
            <p
              class=" mt-4 text-sm font-light leading-6 {planName === 'EARLY_ADOPTER'
                ? 'text-white'
                : 'text-black'} dark:text-gray-300 lg:leading-6"
            >
              {PLANS[planName].DESCRIPTION}
            </p>

            <button
              class="text-md mt-4 block w-full rounded-md {isLoadingPlan === planName &&
                disabledClass} {planName === 'EARLY_ADOPTER'
                ? 'bg-white text-slate-900 hover:bg-indigo-50'
                : PLANS[planName].CTA.IS_DISABLED
                  ? disabledClass
                  : 'bg-primary-900 hover:bg-primary-700 text-white'} flex items-center justify-center py-3 text-center font-medium hover:no-underline lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold"
              on:click={() => {
                if (isLoadingPlan === planName) return;

                handleClick(PLANS[planName], planName);
              }}
            >
              {#if isLoadingPlan === planName}
                <Loading withOverlay={false} small />
              {:else}
                {PLANS[planName].CTA.DASHBOARD_LABEL}
              {/if}
            </button>

            <ul
              class="mt-4 space-y-2 text-sm {planName === 'EARLY_ADOPTER'
                ? 'text-white'
                : 'text-black'} dark:text-gray-300"
            >
              {#each PLANS[planName].FEATURES as features}
                <li class="flex items-center">
                  <div>
                    <Checkmark
                      size={16}
                      fill={planName === 'EARLY_ADOPTER' ? '#fff' : '#1D4EE2'}
                      class="mr-2 lg:mr-3"
                    />
                  </div>
                  <p class="text-sm">
                    {features}
                  </p>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</Modal>
