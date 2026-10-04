<script lang="ts">
  import { PLANS } from '@cio/utils/plans';
  import { PricingCard } from '@cio/ui/custom/pricing-card';
  import { PricingToggle } from '@cio/ui/custom/pricing-toggle';
  import { MachineGlassBox } from '@cio/ui/custom/animation/machines';

  import { PageSignupCTA, PageHeader } from '$lib/components';
  import { MachineCard } from '$lib/components/ui';

  let isYearlyPlan = $state(false);

  const planNames = Object.keys(PLANS) as Array<keyof typeof PLANS>;
  const glassBoxPrice = `${PLANS.EARLY_ADOPTER.PRICE.CURRENCY}${PLANS.EARLY_ADOPTER.PRICE.MONTHLY}/mo`;
</script>

<svelte:head>
  <title>Pricing | ClassroomIO</title>
</svelte:head>

<section>
  <PageHeader className="max-w-content mx-auto px-6 md:px-10 xl:px-0">
    <div class="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
      <div class="flex flex-col items-center text-center lg:items-start lg:text-left">
        <h1 class="text-h2 flex flex-col font-medium text-slate-900 lg:text-[64px]">
          <span>Pick a plan.</span>
          <span class="relative text-blue-700">Launch your academy.</span>
        </h1>
        <p class="text-lead mt-6 max-w-[580px] text-slate-700">
          Basic is free for up to 20 students and includes monthly AI credits. Upgrade for more seats, higher AI limits,
          or a custom domain. Same product for customer, employee, and partner training.
        </p>
        <div class="mt-8">
          <PricingToggle
            bind:isYearly={isYearlyPlan}
            monthlyLabel="Monthly"
            yearlyLabel="Annually"
            saveLabel="Save 2 months"
          />
        </div>
      </div>

      <MachineCard class="hidden bg-gray-50 lg:block">
        <MachineGlassBox
          label="ClassroomIO running inside a glass case with a monthly price tag and a self-host option"
          price={glassBoxPrice}
          class="h-80"
        />
      </MachineCard>
    </div>

    <script
      src="https://widget.senja.io/widget/b43ac234-427e-4d6f-8c23-633208154e54/platform.js"
      type="text/javascript"
      async
    ></script>
    <div
      class="senja-embed mt-10"
      data-id="b43ac234-427e-4d6f-8c23-633208154e54"
      data-mode="shadow"
      data-lazyload="false"
      style="display: block;"
    ></div>
  </PageHeader>

  <div class="w-full px-6 py-20 md:px-10">
    <div class="max-w-content mx-auto">
      <div class="flex w-full flex-wrap items-stretch justify-center gap-6">
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
  header="Start building your academy."
  subText="Sign up free on Basic. Upgrade for more students, higher AI credits, or a custom domain."
  btnLabel="Sign up for free"
  link="/signup"
  demo={false}
/>
