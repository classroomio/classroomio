<script lang="ts">
  import type { CoursePricing, CourseLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
  import { calcCourseDiscount, getCourseCurrencyFormatter } from './landing-page-utils';
  import EditableLandingSection from './editable-section.svelte';
  import LandingButton from './landing-button.svelte';
  import CheckIcon from '@lucide/svelte/icons/check';
  import GiftIcon from '@lucide/svelte/icons/gift';
  import SafeHtmlContent from '../safe-html-content/safe-html-content.svelte';

  interface Props {
    variant: OrgLandingPageTheme;
    pricing: CoursePricing;
    labels?: CourseLandingPageLabels;
  }

  let { variant, pricing, labels }: Props = $props();

  const t = $derived(courseLandingTokens(variant));

  const isFree = $derived(!pricing.cost || pricing.cost <= 0);

  const currencyFormatter = $derived(getCourseCurrencyFormatter(pricing.currency ?? 'USD'));

  const discountedAmount = $derived(
    pricing.showDiscount && pricing.discount && pricing.cost
      ? calcCourseDiscount(pricing.discount, pricing.cost, true)
      : null
  );

  const displayAmount = $derived(discountedAmount ?? pricing.cost ?? 0);
  const formattedDisplayAmount = $derived(currencyFormatter.format(displayAmount));
  const formattedOriginalAmount = $derived(currencyFormatter.format(pricing.cost ?? 0));
</script>

<EditableLandingSection sectionKey="pricing">
  <section id="pricing" class={t.sectionShell}>
    <div class={`${t.sectionInner} ui:flex ui:justify-center`}>
      <div class={`${t.pricingShell} ui:w-full ui:max-w-md`}>
        <div class={t.pricingHeader}>
          <span class={t.pricingEyebrow}>{labels?.pricingEyebrow ?? 'Enrol'}</span>
          {#if isFree}
            <span class={t.pricingAmount}>{labels?.freeLabel ?? 'Free'}</span>
          {:else}
            <div class="ui:flex ui:items-baseline ui:gap-3">
              <span class={t.pricingAmount}>{formattedDisplayAmount}</span>
              {#if discountedAmount !== null}
                <span class={t.pricingDiscount}>{formattedOriginalAmount}</span>
              {/if}
            </div>
            {#if pricing.discount && pricing.showDiscount}
              <span class={t.pricingSavingsBadge}>
                Save {pricing.discount}%
              </span>
            {/if}
          {/if}
        </div>

        {#if pricing.features && pricing.features.length > 0}
          <ul class={t.pricingFeatures}>
            {#each pricing.features as feature}
              <li class={t.pricingFeature}>
                <CheckIcon class={`${t.pricingFeatureIcon} ui:size-4`} />
                <span>{feature}</span>
              </li>
            {/each}
          </ul>
        {/if}

        <LandingButton
          variant="primary"
          size="lg"
          href={pricing.ctaOnclick ? undefined : (pricing.ctaHref ?? '#enroll')}
          onclick={pricing.ctaOnclick}
          class={t.pricingCta}
        >
          {pricing.ctaLabel}
        </LandingButton>

        {#if pricing.reward?.show}
          <div class={t.pricingRewardShell}>
            <div class="ui:flex ui:items-center ui:gap-2 ui:mb-1">
              <GiftIcon class="ui:size-4 ui:text-[var(--landing-accent)]" />
              <span class={t.pricingRewardLabel}>{labels?.pricingRewardLabel ?? 'Bonus'}</span>
            </div>
            <div><SafeHtmlContent content={pricing.reward.description} /></div>
          </div>
        {/if}
      </div>
    </div>
  </section>
</EditableLandingSection>
