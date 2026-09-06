<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { PricingCard } from '@cio/ui/custom/pricing-card';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/PricingCard',
    component: PricingCard,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  // Sample plan data
  const BASIC_PLAN = {
    NAME: 'Basic',
    DESCRIPTION: 'Free tier plan for personal use, no credit card required.',
    PRICE: {
      CURRENCY: '$',
      MONTHLY: '0',
      YEARLY: '0',
      IS_PREMIUM: false
    },
    FEATURES: [
      'Unlimited Courses',
      'Unlimited Q/A',
      '20 Students',
      'AI Course Builder (no video upload)',
      '50K AI credits / month',
      'ClassroomIO branding'
    ],
    CTA: {
      LABEL: 'Signup Now',
      LINK: '/signup?plan=free',
      DASHBOARD_LABEL: 'Current Plan',
      DASHBOARD_LINK: '#disabled',
      IS_DISABLED: true
    }
  };

  const EARLY_ADOPTER_PLAN = {
    NAME: 'Early Adopters',
    DESCRIPTION: 'For fast growing teaching businesses that aim to scale.',
    PRICE: {
      CURRENCY: '$',
      MONTHLY: '35',
      YEARLY: '350',
      IS_PREMIUM: false
    },
    FEATURES: [
      'Everything in Basic',
      'Unlimited Collaborators',
      '10K Students',
      'Advanced AI Course Builder (Video upload & Certificate)',
      'Custom Branding',
      'Slack Invite',
      'Includes all upcoming features'
    ],
    CTA: {
      LABEL: 'I want in 😍',
      LINK: '/signup?plan=early-adopter',
      DASHBOARD_LABEL: 'Upgrade now',
      DASHBOARD_LINK: '',
      IS_DISABLED: false,
      PRODUCT_ID: '1e11ad75-c422-41c1-a541-0e989281276c',
      PRODUCT_ID_YEARLY: 'a84d3a82-3259-4300-b2bf-dccb7bd7814c'
    }
  };

  const ENTERPRISE_PLAN = {
    NAME: 'Enterprise',
    DESCRIPTION: 'Best suited for larger businesses that need more control',
    PRICE: {
      CURRENCY: '',
      MONTHLY: 'Request Pricing',
      YEARLY: 'Request Pricing',
      IS_PREMIUM: true
    },
    FEATURES: ['Everything in Early Adopters plus:', 'Unlimited students', 'Custom Domain', '24/7 Support'],
    CTA: {
      LABEL: 'Contact Us',
      LINK: 'https://cal.com/classroomio/enterprise',
      DASHBOARD_LABEL: 'Contact Us',
      DASHBOARD_LINK: 'https://cal.com/classroomio/enterprise',
      IS_DISABLED: false
    }
  };

  let isLoadingPlan = $state(null);

  function handleClick(plan, planName) {
    console.log('Clicked plan:', planName, plan);
    isLoadingPlan = planName;
    setTimeout(() => {
      isLoadingPlan = null;
    }, 2000);
  }
</script>

<Story name="Basic Plan">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <PricingCard
        plan={BASIC_PLAN}
        planName="BASIC"
        isPopular={false}
        isYearlyPlan={true}
        {isLoadingPlan}
        {handleClick}
      />
    </div>
  {/snippet}
</Story>

<Story name="Early Adopter Plan (Popular)">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <PricingCard
        plan={EARLY_ADOPTER_PLAN}
        planName="EARLY_ADOPTER"
        isPopular={true}
        isYearlyPlan={true}
        {isLoadingPlan}
        {handleClick}
      />
    </div>
  {/snippet}
</Story>

<Story name="Enterprise Plan">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <PricingCard
        plan={ENTERPRISE_PLAN}
        planName="ENTERPRISE"
        isPopular={false}
        isYearlyPlan={true}
        {isLoadingPlan}
        {handleClick}
      />
    </div>
  {/snippet}
</Story>

<Story name="Monthly Pricing">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <PricingCard
        plan={EARLY_ADOPTER_PLAN}
        planName="EARLY_ADOPTER"
        isPopular={true}
        isYearlyPlan={false}
        {isLoadingPlan}
        {handleClick}
      />
    </div>
  {/snippet}
</Story>

<Story name="Yearly Pricing">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <PricingCard
        plan={EARLY_ADOPTER_PLAN}
        planName="EARLY_ADOPTER"
        isPopular={true}
        isYearlyPlan={true}
        {isLoadingPlan}
        {handleClick}
      />
    </div>
  {/snippet}
</Story>

<Story name="Loading State">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <PricingCard
        plan={EARLY_ADOPTER_PLAN}
        planName="EARLY_ADOPTER"
        isPopular={true}
        isYearlyPlan={true}
        isLoadingPlan="EARLY_ADOPTER"
        {handleClick}
      />
    </div>
  {/snippet}
</Story>

<Story name="Custom Labels">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <PricingCard
        plan={EARLY_ADOPTER_PLAN}
        planName="EARLY_ADOPTER"
        isPopular={true}
        isYearlyPlan={true}
        {isLoadingPlan}
        {handleClick}
        popularLabel="Most Popular"
        perOrgLabel="Per Month"
      />
    </div>
  {/snippet}
</Story>

<Story name="All Plans Comparison">
  {#snippet template()}
    <div class="grid grid-cols-1 gap-6 p-4 md:grid-cols-3">
      <PricingCard
        plan={BASIC_PLAN}
        planName="BASIC"
        isPopular={false}
        isYearlyPlan={true}
        {isLoadingPlan}
        {handleClick}
      />
      <PricingCard
        plan={EARLY_ADOPTER_PLAN}
        planName="EARLY_ADOPTER"
        isPopular={true}
        isYearlyPlan={true}
        {isLoadingPlan}
        {handleClick}
      />
      <PricingCard
        plan={ENTERPRISE_PLAN}
        planName="ENTERPRISE"
        isPopular={false}
        isYearlyPlan={true}
        {isLoadingPlan}
        {handleClick}
      />
    </div>
  {/snippet}
</Story>

<Story name="Monthly vs Yearly Toggle">
  {#snippet template()}
    <div class="flex flex-col gap-6 p-4">
      <div class="flex items-center justify-center gap-4">
        <button
          class="ui:bg-primary ui:text-primary-foreground ui:hover:bg-primary/90 rounded-md px-4 py-2"
          onclick={() => {
            const isYearly = $state.snapshot(isYearlyPlan);
            isYearlyPlan = !isYearly;
          }}
        >
          Toggle to {isYearlyPlan ? 'Monthly' : 'Yearly'}
        </button>
        <span class="ui:text-muted-foreground text-sm">
          Current: {isYearlyPlan ? 'Yearly' : 'Monthly'}
        </span>
      </div>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <PricingCard
          plan={BASIC_PLAN}
          planName="BASIC"
          isPopular={false}
          {isYearlyPlan}
          {isLoadingPlan}
          {handleClick}
        />
        <PricingCard
          plan={EARLY_ADOPTER_PLAN}
          planName="EARLY_ADOPTER"
          isPopular={true}
          {isYearlyPlan}
          {isLoadingPlan}
          {handleClick}
        />
        <PricingCard
          plan={ENTERPRISE_PLAN}
          planName="ENTERPRISE"
          isPopular={false}
          {isYearlyPlan}
          {isLoadingPlan}
          {handleClick}
        />
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Website Version">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <PricingCard
        plan={BASIC_PLAN}
        planName="BASIC"
        isPopular={false}
        isYearlyPlan={true}
        {isLoadingPlan}
        {handleClick}
        ctaLabel="Signup Now"
        isDisabled={false}
      />
      <p class="ui:text-muted-foreground text-center text-sm">Website version uses "Signup Now" and is enabled.</p>
    </div>
  {/snippet}
</Story>

<Story name="Disabled CTA">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <PricingCard
        plan={BASIC_PLAN}
        planName="BASIC"
        isPopular={false}
        isYearlyPlan={true}
        {isLoadingPlan}
        {handleClick}
      />
      <p class="ui:text-muted-foreground text-center text-sm">The CTA button is disabled (current plan)</p>
    </div>
  {/snippet}
</Story>
