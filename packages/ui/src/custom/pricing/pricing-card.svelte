<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import { Button } from '../../base/button';
  import { Badge } from '../../base/badge';
  import { PremiumIcon, HoverableItem } from '../moving-icons';
  import type { Plan } from './types';

  let {
    plan,
    planName,
    isYearlyPlan,
    isDashboard = false,
    onSelect,
    ...rest
  } = $props<{
    plan: Plan;
    planName: string;
    isYearlyPlan: boolean;
    isLoading?: boolean;
    isDashboard?: boolean;
    onSelect?: (plan: Plan, planName: string) => void;
    [key: string]: any;
  }>();

  const isPopular = $derived(planName === 'EARLY_ADOPTER');
</script>

<div class="relative flex max-w-sm flex-col rounded-lg p-6 {isPopular ? 'animate-gradient-border' : 'border '}">
  {#if isPopular}
    <Badge
      variant="default"
      class="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-pink-500 to-orange-500"
    >
      Popular
    </Badge>
  {/if}
  <div class="mb-4">
    <h3 class="mb-2 text-lg font-semibold">
      {plan?.NAME}
    </h3>
    <div class="mb-1 flex items-baseline gap-1">
      <span class="text-xl">
        {plan?.PRICE?.CURRENCY}
        {isYearlyPlan ? plan?.PRICE?.YEARLY : plan?.PRICE?.MONTHLY}
      </span>
    </div>
    <p class="text-sm text-gray-500">Per Organization</p>
  </div>

  <HoverableItem>
    {#snippet children(isHovered)}
      <Button
        {...rest}
        variant={isPopular ? 'default' : 'outline'}
        class="mb-6 w-full"
        disabled={plan?.CTA?.IS_DISABLED || isLoading}
        loading={isLoading}
        href={!isDashboard ? plan?.CTA?.LINK : undefined}
        target={!isDashboard ? '_blank' : undefined}
        onclick={(e) => {
          if (isLoading) return;
          if (isDashboard) {
            onSelect?.(plan, planName);
          } else if (onSelect) {
            onSelect(plan, planName);
          }
        }}
      >
        {#if isPopular}
          <PremiumIcon size={16} {isHovered} />
        {/if}
        {isDashboard ? plan?.CTA?.DASHBOARD_LABEL : plan?.CTA?.LABEL}
      </Button>
    {/snippet}
  </HoverableItem>

  <ul class="space-y-3">
    {#each plan?.FEATURES as feature}
      <li class="flex items-start gap-2">
        <CheckIcon class="mt-0.5 size-4 shrink-0" />
        <span class="text-sm leading-relaxed">
          {feature}
        </span>
      </li>
    {/each}
  </ul>
</div>
