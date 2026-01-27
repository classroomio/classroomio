<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import { Badge } from '../../base/badge';
  import { Button } from '../../base/button';
  import { HoverableItem, PremiumIcon } from '../moving-icons';
  import './pricing-card.css';

  export interface PlanData {
    NAME: string;
    DESCRIPTION?: string;
    PRICE: {
      CURRENCY: string;
      MONTHLY: string;
      YEARLY: string;
      IS_PREMIUM: boolean;
    };
    FEATURES: string[];
    CTA: {
      LABEL?: string;
      LINK?: string;
      DASHBOARD_LABEL: string;
      DASHBOARD_LINK?: string;
      IS_DISABLED: boolean;
      PRODUCT_ID?: string;
      PRODUCT_ID_YEARLY?: string;
    };
  }

  interface Props {
    plan: PlanData;
    isPopular?: boolean;
    isYearlyPlan?: boolean;
    isLoadingPlan?: string | null;
    planName: string;
    handleClick?: (plan: PlanData, planName: string) => void;
    popularLabel?: string;
    perOrgLabel?: string;
    ctaLabel?: string;
    isDisabled?: boolean;
  }

  let {
    plan,
    isPopular = false,
    isYearlyPlan = true,
    isLoadingPlan = null,
    planName,
    handleClick = () => {},
    popularLabel = 'Popular',
    perOrgLabel = 'Per Organization',
    ctaLabel = plan.CTA.DASHBOARD_LABEL,
    isDisabled = plan.CTA.IS_DISABLED
  }: Props = $props();

  const isLoading = $derived(isLoadingPlan === planName);
</script>

<div
  class="ui:relative ui:flex ui:max-w-sm ui:flex-col ui:rounded-xl ui:p-8 ui:shadow-sm ui:transition-all ui:hover:shadow-md {isPopular
    ? 'animate-gradient-border'
    : 'ui:border'}"
>
  {#if isPopular}
    <Badge
      variant="default"
      class="ui:absolute ui:-top-3 ui:left-1/2 ui:-translate-x-1/2 ui:bg-linear-to-r ui:from-pink-500 ui:to-orange-500 ui:px-4 ui:py-1"
    >
      {popularLabel}
    </Badge>
  {/if}

  <!-- Plan Header -->
  <div class="ui:mb-8">
    <h3 class="ui:mb-2 ui:text-xl ui:font-bold ui:tracking-tight ui:text-foreground">
      {plan.NAME}
    </h3>
    <div class="ui:mb-1 ui:flex ui:items-baseline ui:gap-1">
      <span class="ui:text-3xl ui:font-bold ui:text-foreground">
        {plan.PRICE.CURRENCY}{isYearlyPlan ? plan.PRICE.YEARLY : plan.PRICE.MONTHLY}
      </span>
    </div>
    <p class="ui:text-sm ui:font-medium ui:text-muted-foreground">{perOrgLabel}</p>
  </div>

  <!-- CTA Button -->
  <div class="ui:mb-8">
    <HoverableItem>
      {#snippet children(isHovered: boolean)}
        <Button
          variant={isPopular ? 'default' : 'outline'}
          class="ui:w-full ui:py-6 ui:text-base ui:font-semibold ui:transition-all"
          disabled={isDisabled || isLoading}
          loading={isLoading}
          onclick={() => {
            if (isLoading) return;
            handleClick(plan, planName);
          }}
        >
          {#if isPopular}
            <PremiumIcon size={18} {isHovered} class="ui:mr-2" />
          {/if}
          {ctaLabel}
        </Button>
      {/snippet}
    </HoverableItem>
  </div>

  <!-- Features List -->
  <div class="ui:flex-1">
    <p class="ui:mb-4 ui:text-sm ui:font-semibold ui:text-foreground">What's included:</p>
    <ul class="ui:space-y-4">
      {#each plan.FEATURES as feature}
        <li class="ui:flex ui:items-start ui:gap-3">
          <div class="ui:mt-1 ui:flex ui:size-5 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-full">
            <CheckIcon class="ui:size-3.5" />
          </div>
          <span class="ui:text-sm ui:leading-relaxed ui:text-muted-foreground">
            {feature}
          </span>
        </li>
      {/each}
    </ul>
  </div>
</div>
