<script lang="ts">
  import type { CoursePricing, CourseLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
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

  const currencySymbol = $derived(
    pricing.currency === 'USD' ? '$' : pricing.currency === 'EUR' ? '€' : pricing.currency === 'GBP' ? '£' : ''
  );

  const discountedAmount = $derived(
    pricing.showDiscount && pricing.discount && pricing.cost
      ? pricing.cost - (pricing.cost * pricing.discount) / 100
      : null
  );

  const displayAmount = $derived(discountedAmount ?? pricing.cost ?? 0);
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
              <span class={t.pricingAmount}>
                {currencySymbol}{displayAmount.toFixed(0)}
                <span class={t.pricingCurrency}>{currencySymbol ? '' : pricing.currency}</span>
              </span>
              {#if discountedAmount !== null}
                <span class={t.pricingDiscount}>
                  {currencySymbol}{(pricing.cost ?? 0).toFixed(0)}
                </span>
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
