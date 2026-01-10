<script lang="ts">
  import type { Plans, Plan } from './types';
  import PricingToggle from './pricing-toggle.svelte';
  import PricingCard from './pricing-card.svelte';

  let {
    plans,
    isLoadingPlan = null,
    isYearlyPlan = $bindable(true),
    isDashboard = false,
    onSelectPlan,
    cardProps = {},
    monthlyLabel = 'Monthly',
    annuallyLabel = 'Annually',
    saveLabel = 'Save 20%'
  } = $props<{
    plans: Plans;
    isLoadingPlan?: string | null;
    isYearlyPlan?: boolean;
    isDashboard?: boolean;
    onSelectPlan?: (plan: Plan, planName: string) => void;
    cardProps?: Record<string, any>;
    monthlyLabel?: string;
    annuallyLabel?: string;
    saveLabel?: string;
  }>();

  const planNames = $derived(Object.keys(plans));
</script>

<div class="flex h-full flex-col items-center justify-center">
  <PricingToggle bind:isYearlyPlan {monthlyLabel} {annuallyLabel} {saveLabel} />

  <div class="grid w-full grid-cols-1 gap-6 overflow-y-auto p-2 md:grid-cols-3 md:overflow-y-visible">
    {#each planNames as planName}
      <PricingCard
        plan={plans[planName]}
        {planName}
        {isYearlyPlan}
        {isDashboard}
        isLoading={isLoadingPlan === planName}
        onSelect={onSelectPlan}
        {...cardProps[planName]}
      />
    {/each}
  </div>
</div>
