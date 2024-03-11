<script>
  import Checkmark from 'carbon-icons-svelte/lib/Checkmark.svelte';
  import PLANS from '../../../../../../../packages/shared-constants/src/plans.json';
</script>

<section id="pricing" class="-mb-20">
  <div class="flex flex-col items-center justify-center">
    <div class="isolate grid grid-cols-1 lg:grid-cols-3">
      <!-- card 1 -->
      <div class="max-w-xl p-4 ring-1 ring-gray-200 lg:max-w-sm">
        <p class="text-lg font-semibold leading-8 text-gray-900 lg:text-xl">Hobby</p>
        <p class="flex items-baseline gap-x-1 font-medium text-baseline">
          USD ${PLANS.FREE.PRICE.MONTHLY} /month
        </p>
        <p class=" mt-4 text-sm font-light leading-6 text-gray-500 lg:leading-6">
          For personal use. Hobby plan is free for up to 5 courses forever, no credit card required.
        </p>
        <button
          class="text-md mt-4 w-full rounded-md bg-slate-900 py-3 font-medium text-white hover:bg-slate-700 lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold"
          data-cal-config={"{'layout':'month_view'}"}
          data-cal-link="classroomio/demo"
        >
          Get started
        </button>
        <ul class="mt-4 space-y-2 text-sm text-gray-600">
          {#each PLANS.FREE.FEATURES as freeFeature}
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
      <div class="max-w-xl bg-gray-900 ring-1 ring-gray-200 p-4 lg:max-w-sm">
        <p class="text-lg font-semibold leading-8 text-white lg:text-xl">Pro</p>
        <p class="flex items-baseline gap-x-1 text-baseline text-white font-medium">
          USD ${PLANS.PRO.PRICE.MONTHLY} per person /month
        </p>
        <p class="mt-4 text-sm font-light leading-6 text-white lg:leading-6">
          Advanced features for small teaching businesses. Built for scale.
        </p>
        <button
          class="text-md mt-4 w-full rounded-md bg-white py-3 font-medium text-slate-900 hover:bg-indigo-50 lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold"
          data-cal-config={"{'layout':'month_view'}"}
          data-cal-link="classroomio/demo"
        >
          Get Started
        </button>
        <ul class="mt-4 space-y-2 text-sm font-light text-white">
          {#each PLANS.PRO.FEATURES as proFeature}
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
      <div class="max-w-xl p-4 ring-1 ring-gray-200 lg:max-w-sm">
        <p class="text-lg font-semibold leading-8 text-gray-900 lg:text-xl">Team</p>
        <p class="flex items-baseline gap-x-1 font-medium text-baseline">
          USD ${PLANS.TEAM.PRICE.MONTHLY} per person /month
        </p>
        <p class=" mt-4 text-sm font-light leading-6 text-gray-500 lg:leading-6">
          Best suited for teams and larger businesses that need more control.
        </p>
        <button
          class="text-md mt-4 w-full rounded-md bg-slate-900 py-3 font-medium text-white hover:bg-slate-700 lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold"
          data-cal-config={"{'layout':'month_view'}"}
          data-cal-link="classroomio/demo"
        >
          Get started
        </button>

        <ul class="mt-4 space-y-2 text-sm text-gray-600">
          {#each PLANS.TEAM.FEATURES as teamFeature}
            <li class="flex items-center">
              <div>
                <Checkmark size={16} fill="#1D4EE2" class="mr-2 lg:mr-3 " />
              </div>
              <p class="text-sm">
                {teamFeature}
              </p>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
</section>
