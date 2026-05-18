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
      <span>Certified training for</span>
      <span class="relative text-blue-700">every team.</span>
    </h1>
    <p class="mt-10 w-[90%] text-center text-lg font-normal text-slate-700 md:w-[60%] lg:mt-7">
      Start with your docs, policies, and videos. Choose the plan that helps you turn them into courses, certificates,
      and completion evidence.
    </p>
    <div class="mt-8">
      <PricingToggle
        bind:isYearly={isYearlyPlan}
        monthlyLabel="Monthly"
        yearlyLabel="Annually"
        saveLabel="Save 2 months"
      />
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

  <div class="w-full px-2 py-16">
    <div class="mx-auto max-w-7xl">
      <div class="flex w-full flex-wrap justify-evenly gap-2">
        {#each planNames as planName}
          {@const plan = PLANS[planName]}
          {@const isPopular = planName === 'EARLY_ADOPTER'}

          <PricingCard
            {plan}
            {planName}
            {isPopular}
            {isYearlyPlan}
            className="mx-auto lg:mx-0 w-full max-w-xs! lg:max-w-sm!"
            ctaLabel={plan.CTA.LABEL}
            isDisabled={false}
            perOrgLabel={isYearlyPlan ? 'per year' : 'per month'}
            handleClick={() => {
              window.open(plan.CTA.LINK, '_blank');
            }}
          />
        {/each}
      </div>
    </div>
    <p class="mt-6 text-center text-sm text-slate-500">
      Need more AI credits? Purchase additional token packs at $5 per 2M tokens from your dashboard.
    </p>
  </div>
</section>

<PageSignupCTA
  header="Choose the plan that fits your training program."
  subText="Start small, prove completion, and scale certified training across your teams, customers, and partners."
  btnLabel="Sign up for free"
  link="/signup"
  demo={false}
/>
