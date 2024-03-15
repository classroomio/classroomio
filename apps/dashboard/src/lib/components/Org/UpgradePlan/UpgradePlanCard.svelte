<script>
  import Checkmark from 'carbon-icons-svelte/lib/Checkmark.svelte';
  import PLANS from 'shared-constants/src/plans/data.json';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';

  function getPlanLink(plan) {
    if (plan.CTA.IS_DISABLED) {
      return;
    }

    const link = plan.CTA.DASHBOARD_LINK;

    if (plan.CTA.DASHBOARD_ADD_TO_LINK) {
      return `${link}?checkout[email]=${$profile.email}&checkout[name]=${$profile.fullname}&checkout[custom][profile_id]=${$profile.id}&checkout[custom][org_id]=${$currentOrg.id}
      `;
    }

    return link;
  }

  $: planNames = Object.keys(PLANS);
</script>

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
          class="text-baseline flex items-baseline gap-x-1 font-medium {planName === 'EARLY_ADOPTER'
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

        <a
          class=" text-md mt-4 block w-full rounded-md {planName === 'EARLY_ADOPTER'
            ? 'bg-white text-slate-900 hover:bg-indigo-50'
            : PLANS[planName].CTA.IS_DISABLED
              ? 'bg-gray-300 text-gray-400 hover:cursor-not-allowed'
              : 'bg-primary-900 hover:bg-primary-700 text-white'} py-3 text-center font-medium hover:no-underline lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold"
          target="_blank"
          href={getPlanLink(PLANS[planName])}
        >
          {PLANS[planName].CTA.DASHBOARD_LABEL}
        </a>

        <ul
          class="mt-4 space-y-2 text-sm {planName === 'EARLY_ADOPTER'
            ? 'text-white'
            : 'text-black'} dark:text-gray-300"
        >
          {#each PLANS[planName].FEATURES as features}
            <li class="flex items-center">
              <div>
                <Checkmark size={16} fill="#1D4EE2" class="mr-2 lg:mr-3" />
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
