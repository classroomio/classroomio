<script lang="ts">
  import type { LearningPathSeriesCourse, LearningPathLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import LockIcon from '@lucide/svelte/icons/lock';

  interface Props {
    variant: OrgLandingPageTheme;
    series: LearningPathSeriesCourse[];
    labels?: LearningPathLandingPageLabels;
  }

  let { variant, series, labels }: Props = $props();

  const t = $derived(courseLandingTokens(variant));

  let expandedCourses = $state<Record<string, boolean>>({});

  function toggleCourse(courseId: string) {
    expandedCourses[courseId] = !expandedCourses[courseId];
  }
</script>

{#if series.length > 0}
  <section id="series" class={t.sectionShell}>
    <div class="ui:max-w-[800px] ui:mx-auto">
      <div class={t.sectionHeader}>
        <span class={t.eyebrow}>{labels?.seriesEyebrow ?? 'Series · take in order'}</span>
        <h2 class={t.heading}>
          {labels?.seriesHeading ?? `${series.length} courses in this path`}
        </h2>
        <p class={t.body}>
          {labels?.seriesLead ?? 'Each course unlocks the next once you finish its lessons and exercises.'}
        </p>
        <span class={t.headingRule} aria-hidden="true"></span>
      </div>

      <div class="ui:flex ui:flex-col ui:gap-6 ui:mt-8">
        {#each series as course, index (course.id)}
          <article
            class="ui:bg-[var(--landing-card)] ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)] ui:[box-shadow:var(--landing-shadow-card)] ui:p-6 ui:sm:p-8"
          >
            <!-- Course Header with Number Badge -->
            <div class="ui:flex ui:items-start ui:gap-4 ui:mb-6">
              <div
                class="ui:size-10 ui:sm:size-12 ui:rounded-xl ui:bg-[var(--landing-accent)]/15 ui:text-[var(--landing-accent)] ui:flex ui:items-center ui:justify-center ui:text-lg ui:sm:text-xl ui:font-bold ui:shrink-0 ui:font-mono"
              >
                {index + 1}
              </div>
              <div class="ui:flex-1">
                <h3
                  class="ui:text-xl ui:sm:text-2xl ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)] ui:leading-tight"
                >
                  {course.title}
                </h3>
                <span
                  class="ui:inline-block ui:text-xs ui:sm:text-sm ui:text-[var(--landing-fg-muted)] ui:mt-1 ui:font-mono"
                >
                  Course {index + 1} · {course.lessonCount ?? course.lessonOutlines.length} lessons
                </span>
                {#if course.description}
                  <p class="ui:text-sm ui:text-[var(--landing-fg-muted)] ui:mt-2 ui:leading-relaxed">
                    {course.description}
                  </p>
                {/if}
              </div>
            </div>

            <!-- What you'll learn outcomes (if present) -->
            {#if course.outcomes && course.outcomes.length > 0}
              <div class="ui:mb-6 ui:pt-4 ui:border-t ui:border-[var(--landing-border)]/60">
                <span
                  class="ui:text-xs ui:font-semibold ui:uppercase ui:tracking-wider ui:text-[var(--landing-fg-muted)] ui:block ui:mb-3"
                >
                  What you'll learn
                </span>
                <ul
                  class="ui:grid ui:grid-cols-1 ui:sm:grid-cols-2 ui:gap-2 ui:text-xs ui:sm:text-sm ui:text-[var(--landing-fg)]"
                >
                  {#each course.outcomes as outcome}
                    <li class="ui:flex ui:items-start ui:gap-2">
                      <CheckIcon class="ui:size-3.5 ui:text-[var(--landing-accent)] ui:shrink-0 ui:mt-0.5" />
                      <span>{outcome}</span>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            <!-- Expandable Lesson Outline -->
            {#if course.lessonOutlines && course.lessonOutlines.length > 0}
              <div class="ui:pt-4 ui:border-t ui:border-[var(--landing-border)]/60">
                <button
                  type="button"
                  onclick={() => toggleCourse(course.id)}
                  class="ui:flex ui:items-center ui:gap-2 ui:text-xs ui:sm:text-sm ui:font-semibold ui:text-[var(--landing-accent)] ui:hover:underline ui:cursor-pointer"
                >
                  <span>{expandedCourses[course.id] ? 'Hide lesson outline' : 'Show lesson outline'}</span>
                  {#if expandedCourses[course.id]}
                    <ChevronUpIcon class="ui:size-4" />
                  {:else}
                    <ChevronDownIcon class="ui:size-4" />
                  {/if}
                </button>

                {#if expandedCourses[course.id]}
                  <div
                    class="ui:mt-4 ui:flex ui:flex-col ui:divide-y ui:divide-[var(--landing-border)]/40 ui:border-t ui:border-[var(--landing-border)]/40"
                  >
                    {#each course.lessonOutlines as lesson, lessonIdx (lesson.id)}
                      <div
                        class="ui:py-2.5 ui:flex ui:items-center ui:justify-between ui:gap-3 ui:text-xs ui:sm:text-sm"
                      >
                        <div class="ui:flex ui:items-center ui:gap-3">
                          <span class="ui:text-xs ui:text-[var(--landing-fg-muted)] ui:font-mono ui:w-6">
                            {(lessonIdx + 1).toString().padStart(2, '0')}
                          </span>
                          <span class="ui:text-[var(--landing-fg)]">{lesson.title}</span>
                        </div>
                        <div class="ui:flex ui:items-center ui:gap-2">
                          {#if lesson.preview}
                            <span
                              class="ui:px-2 ui:py-0.5 ui:text-[11px] ui:font-medium ui:bg-[var(--landing-accent)]/10 ui:text-[var(--landing-accent)] ui:[border-radius:var(--landing-radius-pill)]"
                            >
                              Preview
                            </span>
                          {:else if lesson.gated}
                            <span
                              class="ui:flex ui:items-center ui:gap-1 ui:text-[11px] ui:text-[var(--landing-fg-muted)]"
                            >
                              <LockIcon class="ui:size-3" />
                              <span>{labels?.lockedLabel ?? 'Locked'}</span>
                            </span>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          </article>
        {/each}
      </div>
    </div>
  </section>
{/if}
