<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import { Button } from '@cio/ui/base/button';
  import type { PlanData } from '@cio/ui/custom/pricing-card';
  import NotchCard from './ui/notch-card.svelte';

  interface Props {
    plan: PlanData;
    isPopular?: boolean;
    isYearlyPlan?: boolean;
    perOrgLabel: string;
    popularLabel?: string;
    featuresLabel?: string;
  }

  let {
    plan,
    isPopular = false,
    isYearlyPlan = false,
    perOrgLabel,
    popularLabel = 'Popular',
    featuresLabel = "What's included:"
  }: Props = $props();

  const price = $derived(isYearlyPlan ? plan.PRICE.YEARLY : plan.PRICE.MONTHLY);
  const isNumericPrice = $derived(!Number.isNaN(Number(price)));
  const priceClass = $derived(
    isNumericPrice ? 'text-h3' : 'text-[28px] leading-tight font-semibold tracking-[-0.02em]'
  );
  const cardClass = $derived(isPopular ? 'h-full bg-[#EEF2FF] text-gray-950' : 'h-full bg-gray-50 text-gray-950');
  const dividerClass = $derived(isPopular ? 'border-blue-200' : 'border-gray-200');
</script>

<NotchCard class={cardClass}>
  <div class="flex items-center justify-between gap-3">
    <h3 class="text-card-title font-semibold">{plan.NAME}</h3>
    {#if isPopular}
      <span class="text-tag rounded-full bg-blue-700 px-2.5 py-1 font-mono text-white uppercase">{popularLabel}</span>
    {/if}
  </div>

  <div class="mt-6 flex min-h-12 items-end">
    <span class={priceClass}>{plan.PRICE.CURRENCY}{price}</span>
  </div>
  <p class="mt-1 text-sm text-gray-500">{perOrgLabel}</p>

  <Button
    href={plan.CTA.LINK}
    target="_blank"
    rel="noopener"
    variant={isPopular ? 'default' : 'outline'}
    size="lg"
    class="mt-6 w-full"
  >
    {plan.CTA.LABEL}
  </Button>

  <div class="mt-8 flex-1 border-t pt-6 {dividerClass}">
    <p class="text-label font-mono text-gray-500 uppercase">{featuresLabel}</p>
    <ul class="mt-4 space-y-3">
      {#each plan.FEATURES as feature (feature)}
        <li class="flex items-start gap-3">
          <CheckIcon class="custom mt-0.5 size-4 shrink-0 text-blue-700" strokeWidth={2.2} />
          <span class="text-[15px] leading-snug text-gray-600">{feature}</span>
        </li>
      {/each}
    </ul>
  </div>
</NotchCard>
