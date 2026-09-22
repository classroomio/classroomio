<script lang="ts">
  import type { LearningPathSeriesCourse, LearningPathLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
  import LearningPathAccent from './learning-path-accent.svelte';

  interface Props {
    variant: OrgLandingPageTheme;
    series: LearningPathSeriesCourse[];
    labels?: LearningPathLandingPageLabels;
  }

  let { variant, series, labels }: Props = $props();

  const t = $derived(courseLandingTokens(variant));

  function lessonDuration(minutes: number): string {
    return labels?.lessonDurationLabel?.(minutes) ?? `${minutes}m`;
  }
</script>

{#if series.length > 0}
  <section id="series" class={t.sectionShell}>
    <div class={t.sectionInner}>
      <div class={t.sectionHeader}>
        {#if labels?.seriesEyebrow}
          <span class={t.eyebrow}>{labels.seriesEyebrow}</span>
        {/if}
        <h2 class={t.heading}>{labels?.seriesHeading ?? 'Course series'}</h2>
        <span class={t.headingRule} aria-hidden="true"></span>
      </div>

      <div class="ui:flex ui:flex-col ui:gap-6">
        {#each series as course (course.id)}
          <article
            class="ui:bg-[var(--landing-card)] ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)] ui:[box-shadow:var(--landing-shadow-card)] ui:p-6"
          >
            <div class="ui:flex ui:flex-col ui:gap-4">
              <div>
                <h3 class="ui:text-[var(--landing-fg)] ui:text-lg ui:[font-weight:var(--landing-heading-weight)]">
                  {course.title}
                </h3>
                {#if course.description}
                  <p class="ui:mt-1 ui:text-sm ui:text-[var(--landing-fg-muted)]">{course.description}</p>
                {/if}
              </div>

              <ul class="ui:flex ui:flex-col ui:gap-2">
                {#each course.lessonOutlines as lesson (lesson.id)}
                  <li class="ui:flex ui:items-center ui:gap-3 ui:text-sm">
                    <LearningPathAccent
                      gated={!!lesson.gated}
                      label={lesson.gated ? (labels?.lockedLabel ?? 'Locked') : (labels?.unlockedLabel ?? 'Unlocked')}
                    />
                    <span class="ui:text-[var(--landing-fg)]">{lesson.title}</span>
                    <span class="ui:ml-auto ui:shrink-0 ui:tabular-nums ui:text-[var(--landing-fg-muted)]">
                      {lessonDuration(lesson.durationMinutes)}
                    </span>
                  </li>
                {/each}
              </ul>
            </div>
          </article>
        {/each}
      </div>
    </div>
  </section>
{/if}
