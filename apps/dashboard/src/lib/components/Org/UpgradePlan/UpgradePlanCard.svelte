<script>
  import Checkmark from 'carbon-icons-svelte/lib/Checkmark.svelte';
  import PLANS from '../../../../../../../packages/shared-constants/src/plans.json';
</script>

<section id="pricing">
  <div class="flex flex-col items-center justify-center">
    <div class="isolate grid gap-1 grid-cols-1 lg:grid-cols-3">
      <!-- card 1 -->
      <div class="max-w-xl p-4 ring-1 ring-gray-200 lg:max-w-sm rounded-xl">
        <p class="text-lg font-semibold leading-8 text-gray-900 lg:text-xl mb-2">
          {PLANS.BASIC.NAME}
        </p>
        <p class="flex items-baseline gap-x-1 font-medium text-baseline">
          USD ${PLANS.BASIC.PRICE.MONTHLY}
        </p>
        <p class=" mt-4 text-sm font-light leading-6 text-gray-500 lg:leading-6">
          {PLANS.BASIC.DESCRIPTION}
        </p>
        <a
          class="block hover:no-underline text-center text-md mt-4 w-full rounded-md bg-slate-900 py-3 font-medium text-white hover:bg-slate-700 lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold"
          target="_blank"
          href={PLANS.BASIC.CTA.LINK}
        >
          {PLANS.BASIC.CTA.LABEL}
        </a>
        <ul class="mt-4 space-y-2 text-sm text-gray-600">
          {#each PLANS.BASIC.FEATURES as freeFeature}
            <li class="flex items-center">
              <div>
                <Checkmark size={16} fill="#1D4EE2" class="mr-2 lg:mr-3" />
              </div>
              <p class="text-sm">
                {freeFeature}
              </p>
            </li>
          {/each}
        </ul>
      </div>

      <!-- card 2 -->
      <div class="max-w-xl bg-gray-900 ring-1 rounded-xl ring-gray-200 p-4 lg:max-w-sm">
        <p class="text-lg font-semibold leading-8 text-white lg:text-xl mb-2">
          {PLANS.EARLY_ADOPTER.NAME}
        </p>
        <p class="flex items-baseline gap-x-1 text-baseline text-white font-medium">
          USD ${PLANS.EARLY_ADOPTER.PRICE.MONTHLY}
        </p>
        <p class="mt-4 text-sm font-light leading-6 text-white lg:leading-6">
          {PLANS.EARLY_ADOPTER.DESCRIPTION}
        </p>
        <a
          class="block hover:no-underline text-center text-md mt-4 w-full rounded-md bg-white py-3 font-medium text-slate-900 hover:bg-indigo-50 lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold"
          target="_blank"
          href={PLANS.EARLY_ADOPTER.CTA.LINK}
        >
          {PLANS.EARLY_ADOPTER.CTA.LABEL}
        </a>
        <ul class="mt-4 space-y-2 text-sm font-light text-white">
          {#each PLANS.EARLY_ADOPTER.FEATURES as proFeature}
            <li class="flex items-center">
              <div>
                <Checkmark size={16} fill="#1D4EE2" class="mr-2 lg:mr-3 " />
              </div>
              <p class="text-sm">
                {proFeature}
              </p>
            </li>
          {/each}
        </ul>
      </div>

      <!-- card 3 -->
      <div class="max-w-xl p-4 ring-1 rounded-xl ring-gray-200 lg:max-w-sm">
        <p class="text-lg font-semibold leading-8 text-gray-900 lg:text-xl mb-2">
          {PLANS.ENTERPRISE.NAME}
        </p>
        <p class="flex items-baseline gap-x-1 font-medium text-baseline">Request Pricing</p>
        <p class=" mt-4 text-sm font-light leading-6 text-gray-500 lg:leading-6">
          {PLANS.ENTERPRISE.DESCRIPTION}
        </p>
        <button
          class="text-md mt-4 w-full rounded-md bg-slate-900 py-3 font-medium text-white hover:bg-slate-700 lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold"
          data-cal-config={"{'layout':'month_view'}"}
          data-cal-link="classroomio/enterprise"
        >
          {PLANS.ENTERPRISE.CTA.LABEL}
        </button>

        <ul class="mt-4 space-y-2 text-sm text-gray-600">
          {#each PLANS.ENTERPRISE.FEATURES as Feature}
            <li class="flex items-center">
              <div>
                <Checkmark size={16} fill="#1D4EE2" class="mr-2 lg:mr-3 " />
              </div>
              <p class="text-sm">
                {Feature}
              </p>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
</section>
