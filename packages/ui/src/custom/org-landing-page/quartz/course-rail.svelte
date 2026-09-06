<script lang="ts">
  import type { CoursePricing, CourseSocialProof, CourseCurriculum, CourseLandingPageLabels } from '../types';
  import { calcCourseDiscount } from '../landing-page-utils';
  import { getCurrencyFormatter } from '@cio/utils/functions';
  import EditableLandingSection from '../editable-section.svelte';
  import LandingButton from '../landing-button.svelte';
  import CheckIcon from '@lucide/svelte/icons/check';
  import GiftIcon from '@lucide/svelte/icons/gift';

  interface Props {
    pricing: CoursePricing;
    socialProof: CourseSocialProof;
    curriculum: CourseCurriculum;
    labels?: CourseLandingPageLabels;
  }

  let { pricing, socialProof, curriculum, labels }: Props = $props();

  const isFree = $derived(!pricing.cost || pricing.cost <= 0);
  const currencyFormatter = $derived(getCurrencyFormatter(pricing.currency ?? 'USD'));

  const discountedAmount = $derived(
    pricing.showDiscount && pricing.discount && pricing.cost
      ? calcCourseDiscount(pricing.discount, pricing.cost, true)
      : null
  );

  const displayAmount = $derived(discountedAmount ?? pricing.cost ?? 0);
  const formattedDisplayAmount = $derived(currencyFormatter.format(displayAmount));
  const formattedOriginalAmount = $derived(currencyFormatter.format(pricing.cost ?? 0));

  const lessonCount = $derived(
    socialProof.lessons ?? curriculum.sections.reduce((total, section) => total + section.lessons.length, 0)
  );
  const exerciseCount = $derived(
    curriculum.sections.reduce((total, section) => total + (section.exerciseCount ?? 0), 0)
  );

  /** Rows are only rendered when the underlying prop exists, so a sparse course shows a short table. */
  const facts = $derived(
    [
      lessonCount > 0 ? { label: labels?.socialProofLessonsLabel ?? 'Lessons', value: String(lessonCount) } : null,
      exerciseCount > 0 ? { label: 'Exercises', value: String(exerciseCount) } : null,
      socialProof.type ? { label: labels?.socialProofTypeLabel ?? 'Format', value: socialProof.type } : null,
      socialProof.rating
        ? { label: labels?.socialProofRatingLabel ?? 'Rating', value: String(socialProof.rating) }
        : null,
      socialProof.hasCertificate
        ? { label: labels?.socialProofCertificateLabel ?? 'Certificate', value: 'Included' }
        : null
    ].filter((fact) => fact !== null)
  );
</script>

<EditableLandingSection sectionKey="pricing">
  <aside id="pricing" class="ui:p-7 ui:@4xl:sticky ui:@4xl:top-[82px] ui:@4xl:self-start">
    <span
      class="ui:block ui:text-xs ui:text-[var(--landing-fg-faint)] ui:[letter-spacing:var(--landing-eyebrow-tracking)] ui:[text-transform:var(--landing-eyebrow-case)]"
    >
      {labels?.pricingEyebrow ?? 'Enrol'}
    </span>

    <div class="ui:mt-3.5 ui:flex ui:items-baseline ui:gap-3">
      {#if isFree}
        <span
          class="ui:text-[40px] ui:leading-none ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)] ui:[letter-spacing:var(--landing-heading-tracking)]"
        >
          {labels?.freeLabel ?? 'Free'}
        </span>
      {:else}
        <span
          class="ui:text-[40px] ui:leading-none ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)] ui:[letter-spacing:var(--landing-heading-tracking)]"
        >
          {formattedDisplayAmount}
        </span>
        {#if discountedAmount !== null}
          <span class="ui:text-[15px] ui:text-[var(--landing-fg-faint)] ui:line-through">{formattedOriginalAmount}</span
          >
        {/if}
      {/if}
    </div>

    <div class="ui:mt-6">
      <LandingButton
        variant="primary"
        size="lg"
        href={pricing.ctaHref}
        onclick={pricing.ctaOnclick}
        disabled={pricing.ctaDisabled}
        class="ui:w-full"
      >
        {pricing.ctaLabel}
      </LandingButton>
    </div>

    {#if pricing.features && pricing.features.length > 0}
      <ul class="ui:mt-6 ui:m-0 ui:p-0 ui:list-none ui:flex ui:flex-col ui:gap-2.5">
        {#each pricing.features as feature (feature)}
          <li class="ui:flex ui:items-start ui:gap-2.5 ui:text-sm ui:text-[var(--landing-fg-muted)]">
            <CheckIcon class="ui:size-4 ui:shrink-0 ui:mt-0.5 ui:text-[var(--landing-fg)]" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        {/each}
      </ul>
    {/if}

    {#if facts.length > 0}
      <dl class="ui:mt-7 ui:m-0 ui:border-t ui:border-[var(--landing-border)]">
        {#each facts as fact (fact.label)}
          <div
            class="ui:flex ui:items-center ui:justify-between ui:gap-4 ui:py-2.5 ui:border-b ui:border-[var(--landing-border-soft)]"
          >
            <dt class="ui:text-[13.5px] ui:text-[var(--landing-fg-muted)]">{fact.label}</dt>
            <dd class="ui:m-0 ui:text-[13.5px] ui:font-medium ui:text-[var(--landing-fg)]">{fact.value}</dd>
          </div>
        {/each}
      </dl>
    {/if}

    {#if pricing.reward?.show}
      <p
        class="ui:mt-6 ui:m-0 ui:flex ui:items-start ui:gap-2.5 ui:text-[13.5px] ui:leading-relaxed ui:text-[var(--landing-fg-muted)]"
      >
        <GiftIcon class="ui:size-4 ui:shrink-0 ui:mt-0.5 ui:text-[var(--landing-fg)]" aria-hidden="true" />
        <span>{pricing.reward.description}</span>
      </p>
    {/if}
  </aside>
</EditableLandingSection>
