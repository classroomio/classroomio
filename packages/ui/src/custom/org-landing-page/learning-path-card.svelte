<script lang="ts">
  import type { LearningPathItem, OrgLandingPageLabels } from './types';
  import LayersIcon from '@lucide/svelte/icons/layers';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import AwardIcon from '@lucide/svelte/icons/award';
  import { defaultLearningPathCourseCountLabel } from './landing-page-utils';

  interface Props {
    path: LearningPathItem;
    disableCourseLinks?: boolean;
    labels?: OrgLandingPageLabels;
  }

  let { path, disableCourseLinks = false, labels }: Props = $props();

  const href = $derived.by(() => {
    if (disableCourseLinks) return undefined;
    return path.link || (path.slug ? `/learning-paths/${path.slug}` : undefined);
  });

  const courseCountLabel = $derived(
    (labels?.learningPathCourseCountLabel ?? defaultLearningPathCourseCountLabel)(path.courseCount ?? 0)
  );

  function formatCurrency(cost?: number, currency = 'USD') {
    if (!cost) return labels?.freeLabel ?? 'Free';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cost);
  }
</script>

<!--
  Shared across every landing-page theme (unlike course-card.svelte, which is
  hand-authored per theme). Styling is driven entirely by the `--landing-*`
  CSS custom properties injected by LandingThemeScope, so this one component
  automatically re-skins correctly inside any theme without per-theme forks.
-->
<a
  {href}
  class="ui:block ui:h-full ui:no-underline {disableCourseLinks
    ? 'ui:cursor-default'
    : 'ui:cursor-pointer ui:transition-colors'}"
  aria-disabled={disableCourseLinks}
  tabindex={disableCourseLinks ? -1 : undefined}
>
  <div
    class="ui:flex ui:h-full ui:flex-col ui:overflow-hidden ui:border ui:transition-colors"
    style="background: var(--landing-card); border-color: var(--landing-border); border-radius: var(--landing-radius-card); box-shadow: var(--landing-shadow-card);"
  >
    {#if path.logo}
      <div class="ui:aspect-video ui:w-full ui:overflow-hidden">
        <img src={path.logo} alt={path.title} class="ui:h-full ui:w-full ui:object-cover" />
      </div>
    {/if}

    <div class="ui:flex ui:flex-1 ui:flex-col ui:gap-4 ui:p-6">
      <span
        class="ui:inline-flex ui:w-fit ui:items-center ui:gap-1.5 ui:text-xs ui:font-semibold"
        style="color: var(--landing-accent); letter-spacing: var(--landing-eyebrow-tracking); text-transform: var(--landing-eyebrow-case);"
      >
        <LayersIcon class="ui:size-3.5" />
        {labels?.learningPathLabel ?? 'Learning Path'}
      </span>

      <h3
        class="ui:text-xl"
        style="color: var(--landing-fg); font-weight: var(--landing-heading-weight); letter-spacing: var(--landing-heading-tracking); text-transform: var(--landing-heading-case);"
      >
        {path.title}
      </h3>

      <p class="ui:line-clamp-2 ui:text-sm ui:leading-relaxed" style="color: var(--landing-fg-muted)">
        {path.description}
      </p>

      <div
        class="ui:mt-auto ui:flex ui:flex-wrap ui:items-center ui:gap-x-5 ui:gap-y-2 ui:pt-2 ui:text-sm"
        style="color: var(--landing-fg-muted)"
      >
        <span class="ui:flex ui:items-center ui:gap-1.5">
          <LayersIcon class="ui:size-4" />
          {courseCountLabel}
        </span>
        {#if path.totalHours}
          <span class="ui:flex ui:items-center ui:gap-1.5">
            <ClockIcon class="ui:size-4" />
            {path.totalHours}h
          </span>
        {/if}
        {#if path.hasCertificate}
          <span class="ui:flex ui:items-center ui:gap-1.5">
            <AwardIcon class="ui:size-4" />
            Certificate
          </span>
        {/if}
        <span class="ui:ml-auto ui:font-semibold" style="color: var(--landing-fg)">
          {path.price || formatCurrency(path.cost, path.currency)}
        </span>
      </div>
    </div>
  </div>
</a>
