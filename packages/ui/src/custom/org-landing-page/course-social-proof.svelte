<script lang="ts">
  import type { CourseSocialProof, CourseLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
  import StarIcon from '@lucide/svelte/icons/star';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import LayoutListIcon from '@lucide/svelte/icons/layout-list';
  import AwardIcon from '@lucide/svelte/icons/award';

  interface Props {
    variant: OrgLandingPageTheme;
    socialProof: CourseSocialProof;
    labels?: CourseLandingPageLabels;
  }

  let { variant, socialProof, labels }: Props = $props();

  const t = $derived(courseLandingTokens(variant));

  const items = $derived(
    [
      socialProof.rating !== undefined
        ? {
            key: 'rating',
            value: socialProof.rating.toFixed(1),
            label: labels?.socialProofRatingLabel ?? 'Rating',
            Icon: StarIcon
          }
        : null,
      socialProof.lessons !== undefined
        ? {
            key: 'lessons',
            value: socialProof.lessons.toString(),
            label: labels?.socialProofLessonsLabel ?? 'Lessons',
            Icon: BookOpenIcon
          }
        : null,
      socialProof.type
        ? {
            key: 'type',
            value: socialProof.type,
            label: labels?.socialProofTypeLabel ?? 'Format',
            Icon: LayoutListIcon
          }
        : null,
      socialProof.hasCertificate
        ? {
            key: 'certificate',
            value: 'Included',
            label: labels?.socialProofCertificateLabel ?? 'Certificate',
            Icon: AwardIcon
          }
        : null
    ].filter(Boolean) as Array<{
      key: string;
      value: string;
      label: string;
      Icon: typeof StarIcon;
    }>
  );
</script>

<section class={t.socialProofShell}>
  <div class="ui:max-w-[1200px] ui:mx-auto">
    <div class="ui:flex ui:flex-wrap ui:items-center ui:justify-around ui:gap-6 ui:md:gap-10">
      {#each items as item, idx (item.key)}
        <div class={t.socialProofItem}>
          <div class="ui:flex ui:items-center ui:gap-2">
            <item.Icon class="ui:size-4 ui:text-[var(--landing-accent)]" />
            <span class={t.socialProofValue}>{item.value}</span>
          </div>
          <span class={t.socialProofLabel}>{item.label}</span>
        </div>
        {#if idx < items.length - 1}
          <span class={t.socialProofDivider} aria-hidden="true"></span>
        {/if}
      {/each}
    </div>
  </div>
</section>
