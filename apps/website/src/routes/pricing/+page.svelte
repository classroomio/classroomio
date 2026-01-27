<script lang="ts">
  import Check from '@lucide/svelte/icons/check';
  import { fade } from 'svelte/transition';

  import { PLANS } from '@cio/utils/plans';
  import { PricingCard } from '@cio/ui/custom/pricing-card';

  import { PageSignupCTA, PageHeader } from '$lib/components';

  let isYearlyPlan = $state(false);

  function toggleIsYearlyPlan() {
    isYearlyPlan = !isYearlyPlan;
  }

  const planNames = Object.keys(PLANS) as Array<keyof typeof PLANS>;
</script>

<svelte:head>
  <title>Pricing | ClassroomIO</title>
</svelte:head>

<section>
  <PageHeader className="flex flex-col items-center justify-center text-center">
    <h1 class="mx-auto flex flex-col items-center text-4xl text-slate-900 md:text-6xl">
      <span>There is room for</span>
      <span class="relative text-blue-700">Everyone.</span>
    </h1>
    <p class="mt-10 w-[90%] text-center text-lg font-normal text-slate-700 md:w-[60%] lg:mt-7">
      You get a customizable LMS, AI integration for productive educators and many more...
    </p>
    <div class="relative mt-10 flex items-center rounded-[30px] border-2 p-[2px] lg:scale-100">
      <button
        style="background-color: {isYearlyPlan ? 'initial' : '#1D4EE2'}; color: {isYearlyPlan ? '#5e636b' : '#fff'}"
        class="rounded-[30px] bg-blue-700 px-3 py-1 text-xs text-white lg:px-4 lg:py-2"
        onclick={toggleIsYearlyPlan}>Monthly</button
      >
      <button
        style="background-color: {isYearlyPlan ? '#1D4EE2' : ''}; color: {isYearlyPlan ? '#fff' : '#5e636b'}"
        class="rounded-[30px] px-3 py-1 text-xs text-white lg:px-4 lg:py-2"
        onclick={toggleIsYearlyPlan}>Annually</button
      >
      <div
        class="absolute top-[-85%] right-[-40%] scale-[90%] rounded-full bg-[#006600] px-3.5 py-1.5 text-xs text-white lg:top-[-75%] lg:right-[-43%] lg:scale-100"
      >
        Save 2 months
      </div>
    </div>

    <script
      src="https://widget.senja.io/widget/b43ac234-427e-4d6f-8c23-633208154e54/platform.js"
      type="text/javascript"
      async
    ></script>
    <div
      class="senja-embed mt-5"
      data-id="b43ac234-427e-4d6f-8c23-633208154e54"
      data-mode="shadow"
      data-lazyload="false"
      style="display: block;"
    ></div>
  </PageHeader>

  <div class="w-full px-[6%] py-16">
    <div class="mx-auto max-w-7xl">
      <div class="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {#each planNames as planName}
          {@const plan = PLANS[planName]}
          {@const isPopular = planName === 'EARLY_ADOPTER'}

          <PricingCard
            {plan}
            {planName}
            {isPopular}
            {isYearlyPlan}
            ctaLabel={plan.CTA.LABEL}
            isDisabled={false}
            perOrgLabel={isYearlyPlan ? 'per year' : 'per month'}
          />
        {/each}
      </div>
    </div>
  </div>
</section>

<PageSignupCTA
  header="Bring your bootcamp vision online"
  subText="Try before you buy. No credit card required."
  btnLabel="Sign up for free"
  link="/signup"
  demo={false}
/>
