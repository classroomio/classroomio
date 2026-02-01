<script lang="ts">
  import { PLANS } from '@cio/utils/plans';
  import { PricingCard } from '@cio/ui/custom/pricing-card';
  import { PricingToggle } from '@cio/ui/custom/pricing-toggle';

  import { PageSignupCTA, PageHeader } from '$lib/components';

  let isYearlyPlan = $state(false);

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
    <div class="mt-8">
      <PricingToggle
        bind:isYearly={isYearlyPlan}
        monthlyLabel="Monthly"
        yearlyLabel="Annually"
        saveLabel="Save 2 months"
      />
      <p class="mt-2 text-xs text-slate-400">Debug: {isYearlyPlan ? 'Yearly' : 'Monthly'}</p>
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
