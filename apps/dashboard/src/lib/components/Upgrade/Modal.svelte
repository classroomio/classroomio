<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { OrganizationPlan } from '$lib/utils/types';
  import { supabase } from '$lib/utils/functions/supabase';
  import { goto } from '$app/navigation';
  import { currentOrg } from '$lib/utils/store/org';
  import { page } from '$app/stores';
  import Checkmark from 'carbon-icons-svelte/lib/Checkmark.svelte';
  import PLANS from 'shared-constants/src/plans/data.json';
  import { profile } from '$lib/utils/store/user';
  import { subscribeToProduct } from '$lib/utils/services/lemonsqueezy/subscribe';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { Loading } from 'carbon-components-svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

  const disabledClass = 'bg-gray-300 text-gray-400 hover:cursor-not-allowed';

  let isLoadingPlan: string | null = null;
  let orgPlanChannel: RealtimeChannel;
  let open = false;

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
      const { checkoutURL } = await subscribeToProduct({
        productId: plan.CTA.PRODUCT_ID,
        email: $profile.email,
        name: $profile.fullname,
        triggeredBy: $currentOrg.memberId,
        orgId: $currentOrg.id
      });

      if (!checkoutURL) {
        snackbar.error('Failed to generate success');
        return;
      }

      window.open(checkoutURL, '_blank');
    } catch (error) {
      console.error('Error subscribing', error);

      snackbar.error('Failed, please try again later');
    }

    isLoadingPlan = null;
  }

  async function handleInsert(payload: RealtimePostgresChangesPayload<OrganizationPlan>) {
    const newPlan = payload.new as OrganizationPlan;

    console.log('A new plan was inserted');
    // If plan was successfully generated
    if (newPlan.org_id === $currentOrg.id && newPlan.is_active) {
      window.location.reload();
    }
  }

  onMount(() => {
    orgPlanChannel = supabase
      .channel('any')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'organization_plan' },
        handleInsert
      )
      .subscribe();
  });

  onDestroy(() => {
    if (orgPlanChannel) {
      supabase.removeChannel(orgPlanChannel);
    }
  });

  $: {
    const query = new URLSearchParams($page.url.search);
    open = (query.get('upgrade') || '') === 'true';
  }
  $: planNames = Object.keys(PLANS);
</script>

<Modal
  onClose={() => goto($page.url.pathname)}
  {open}
  width="w-4/5"
  containerClass=""
  modalHeading="Upgrade Plan"
>
  <div>
    <div class="flex flex-col items-center justify-center">
      <div class="isolate grid grid-cols-1 gap-3 lg:grid-cols-3">
        {#each planNames as planName}
          <div
            class="max-w-xl rounded-xl {planName === 'EARLY_ADOPTER' &&
              'bg-primary-900'} p-4 ring-1 ring-gray-200 lg:max-w-sm"
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
              {PLANS[planName].PRICE.MONTHLY}
              {#if !PLANS[planName].PRICE.IS_PREMIUM}
                /month
              {/if}
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
                  : 'bg-primary-900 hover:bg-primary-700 text-white'} py-3 text-center font-medium hover:no-underline lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold flex items-center justify-center"
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
  </div>
</Modal>
