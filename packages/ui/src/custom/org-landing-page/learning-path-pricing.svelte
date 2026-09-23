<script lang="ts">
  import type { LearningPathLandingPageLabels, LearningPathPricingInfo, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
  import { safeHref } from './safe-href';
  import CheckIcon from '@lucide/svelte/icons/check';

  interface Props {
    variant: OrgLandingPageTheme;
    pricing?: LearningPathPricingInfo;
    labels?: LearningPathLandingPageLabels;
  }

  let { variant, pricing, labels }: Props = $props();

  const t = $derived(courseLandingTokens(variant));

  const isFree = $derived(pricing?.cost === 0);
  const costDisplay = $derived(
    isFree
      ? (labels?.enrollFreeLabel ?? 'Free')
      : pricing?.currency === 'USD' || !pricing?.currency
        ? `$${pricing?.cost ?? 199}`
        : `${pricing?.currency} ${pricing?.cost ?? 199}`
  );

  const originalCostDisplay = $derived(
    pricing?.originalCost
      ? pricing?.currency === 'USD' || !pricing?.currency
        ? `$${pricing.originalCost}`
        : `${pricing.currency} ${pricing.originalCost}`
      : null
  );

  const savingsAmount = $derived(
    pricing?.originalCost && pricing?.cost && pricing.originalCost > pricing.cost
      ? pricing.originalCost - pricing.cost
      : null
  );

  const savingsPercent = $derived(
    pricing?.originalCost && savingsAmount ? Math.round((savingsAmount / pricing.originalCost) * 100) : null
  );

  const defaultFeatures = [
    'All courses unlocked in sequential order',
    'Full curriculum with lessons, exercises & capstone',
    'Verified path certificate on completion',
    'Permanent lifetime access'
  ];

  const features = $derived(pricing?.features && pricing.features.length > 0 ? pricing.features : defaultFeatures);
</script>

<section id="pricing" class={t.sectionShell}>
  <div class="ui:max-w-[640px] ui:mx-auto">
    <div
      class="ui:bg-[var(--landing-card)] ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)] ui:[box-shadow:var(--landing-shadow-card)] ui:p-8 ui:sm:p-10 ui:flex ui:flex-col ui:items-center ui:text-center"
    >
      <span
        class="ui:text-xs ui:font-semibold ui:uppercase ui:tracking-widest ui:text-[var(--landing-fg-muted)] ui:mb-3"
      >
        {labels?.pricingEyebrow ?? 'Enrollment'}
      </span>

      <div
        class="ui:text-5xl ui:sm:text-6xl ui:font-bold ui:text-[var(--landing-fg)] ui:tracking-tight ui:font-mono ui:mb-2"
      >
        {costDisplay}
      </div>

      {#if originalCostDisplay && savingsPercent}
        <div class="ui:flex ui:items-center ui:gap-2 ui:text-sm ui:text-[var(--landing-fg-muted)] ui:mb-6">
          <span class="ui:line-through">{originalCostDisplay}</span>
          <span
            class="ui:inline-flex ui:items-center ui:px-2.5 ui:py-0.5 ui:text-xs ui:font-semibold ui:bg-[var(--landing-accent)]/10 ui:text-[var(--landing-accent)]"
          >
            Save ${savingsAmount} ({savingsPercent}%)
          </span>
        </div>
      {:else}
        <div class="ui:mb-6"></div>
      {/if}

      <ul
        class="ui:flex ui:flex-col ui:gap-3 ui:text-sm ui:text-[var(--landing-fg)] ui:text-left ui:w-full ui:max-w-md ui:mb-8 ui:py-6 ui:border-y ui:border-[var(--landing-border)]/60"
      >
        {#each features as feature}
          <li class="ui:flex ui:items-start ui:gap-3">
            <CheckIcon class="ui:size-4 ui:shrink-0 ui:text-[var(--landing-accent)] ui:mt-0.5" />
            <span>{feature}</span>
          </li>
        {/each}
      </ul>

      <a
        href={safeHref(pricing?.ctaHref ?? '#')}
        class="ui:w-full ui:max-w-md ui:inline-flex ui:items-center ui:justify-center ui:px-8 ui:py-4 ui:text-base ui:font-semibold ui:text-[var(--landing-accent-fg)] ui:bg-[var(--landing-accent)] ui:[border-radius:var(--landing-radius-button)] ui:hover:opacity-95 ui:transition-all ui:shadow-lg ui:cursor-pointer"
      >
        {pricing?.ctaLabel ?? labels?.enrollPathLabel ?? 'Enroll in this path'}
      </a>
    </div>
  </div>
</section>
