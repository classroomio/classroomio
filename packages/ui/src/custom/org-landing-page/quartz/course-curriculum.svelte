<script lang="ts">
  import type { CourseCurriculum, CourseCurriculumSection, CourseLandingPageLabels } from '../types';
  import BookOpenTextIcon from '@lucide/svelte/icons/book-open-text';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ListChecksIcon from '@lucide/svelte/icons/list-checks';
  import PackageIcon from '@lucide/svelte/icons/package';
  import QuartzCourseSection from './course-section.svelte';

  interface Props {
    curriculum: CourseCurriculum;
    labels?: CourseLandingPageLabels;
  }

  let { curriculum, labels }: Props = $props();

  const lessonTotal = $derived(curriculum.sections.reduce((total, section) => total + section.lessons.length, 0));

  const moduleTotal = $derived(curriculum.sections.length);
  const firstSectionId = $derived(curriculum.sections.find((section) => !section.standalone)?.id);

  /** Both counts are useful, so the whole phrase is localizable rather than composed here. */
  const heading = $derived.by(() => {
    if (labels?.curriculumSummaryLabel) return labels.curriculumSummaryLabel(lessonTotal, moduleTotal);

    const lessons = labels?.lessonsLabel?.(lessonTotal) ?? `${lessonTotal} ${lessonTotal === 1 ? 'lesson' : 'lessons'}`;

    return `${lessons} across ${moduleTotal} ${moduleTotal === 1 ? 'module' : 'modules'}`;
  });

  function sectionMeta(lessonCount: number, exerciseCount?: number, activityCount?: number): string {
    const lessons = labels?.lessonsLabel?.(lessonCount) ?? `${lessonCount} ${lessonCount === 1 ? 'lesson' : 'lessons'}`;
    const parts = [lessons];
    if (exerciseCount) {
      parts.push(
        labels?.exercisesLabel?.(exerciseCount) ?? `${exerciseCount} ${exerciseCount === 1 ? 'exercise' : 'exercises'}`
      );
    }
    if (activityCount) {
      parts.push(
        labels?.activitiesLabel?.(activityCount) ?? `${activityCount} ${activityCount === 1 ? 'package' : 'packages'}`
      );
    }

    return parts.join(' · ');
  }

  function standaloneLabel(kind: 'lesson' | 'exercise' | 'activity'): string {
    if (kind === 'exercise') return labels?.standaloneExerciseLabel ?? 'Exercise';
    if (kind === 'activity') return labels?.activitiesLabel?.(1) ?? 'Package';

    return labels?.standaloneLessonLabel ?? 'Lesson';
  }
</script>

{#snippet standaloneModules(section: CourseCurriculumSection)}
  {#if section.standalone === 'activity'}
    <div class="ui:pl-9 ui:pb-3 ui:border-b ui:border-[var(--landing-border)]">
      {#each section.activities ?? [] as activity (activity.id)}
        {#each activity.modules ?? [] as module (module.id)}
          <div
            class="ui:flex ui:items-center ui:gap-3 ui:py-2 ui:text-[13.5px] ui:text-[var(--landing-fg-faint)] ui:border-t ui:border-[var(--landing-border-soft)] ui:first:border-t-0"
          >
            <span class="ui:min-w-0 ui:truncate">{module.title}</span>
          </div>
        {/each}
      {/each}
    </div>
  {/if}
{/snippet}

{#if curriculum.sections.length > 0}
  <QuartzCourseSection
    id="curriculum"
    sectionKey="curriculum"
    eyebrow={labels?.curriculumEyebrow ?? 'Curriculum'}
    heading={labels?.curriculumHeading ?? heading}
  >
    <div class="ui:border-t ui:border-[var(--landing-border)]">
      {#each curriculum.sections as section, index (section.id)}
        {#if section.standalone}
          <div>
            <div
              class="ui:w-full ui:flex ui:items-center ui:gap-3.5 ui:py-4 ui:border-b ui:border-[var(--landing-border)]"
            >
              <span class="ui:w-6 ui:text-xs ui:tabular-nums ui:text-[var(--landing-fg-faint)]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span
                class="ui:flex-1 ui:text-base ui:font-medium ui:text-[var(--landing-fg)] ui:[letter-spacing:var(--landing-heading-tracking)]"
              >
                {section.title}
              </span>
              <span class="ui:text-[13px] ui:text-[var(--landing-fg-faint)]">{standaloneLabel(section.standalone)}</span
              >
              <span class="ui:size-4 ui:shrink-0" aria-hidden="true"></span>
            </div>
            {@render standaloneModules(section)}
          </div>
        {:else}
          <!-- Native disclosure: no component state to drift out of sync with the curriculum prop. -->
          <details class="ui:group" open={section.id === firstSectionId}>
            <summary
              class="ui:w-full ui:flex ui:items-center ui:gap-3.5 ui:py-4 ui:text-left ui:cursor-pointer ui:list-none ui:border-b ui:border-[var(--landing-border)] ui:[&::-webkit-details-marker]:hidden"
            >
              <span class="ui:w-6 ui:text-xs ui:tabular-nums ui:text-[var(--landing-fg-faint)]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span
                class="ui:flex-1 ui:text-base ui:font-medium ui:text-[var(--landing-fg)] ui:[letter-spacing:var(--landing-heading-tracking)]"
              >
                {section.title}
              </span>
              <span class="ui:text-[13px] ui:text-[var(--landing-fg-faint)]">
                {sectionMeta(
                  section.lessons.length,
                  section.exerciseCount,
                  section.activityCount ?? section.activities?.length
                )}
              </span>
              <ChevronDownIcon
                class="ui:size-4 ui:shrink-0 ui:text-[var(--landing-fg-faint)] ui:transition-transform ui:group-open:rotate-180"
              />
            </summary>

            <div class="ui:pl-9 ui:pb-3 ui:border-b ui:border-[var(--landing-border)]">
              {#each section.items ?? section.lessons as item (item.id)}
                <div
                  class="ui:flex ui:items-center ui:gap-3 ui:py-2.5 ui:text-[14.5px] ui:text-[var(--landing-fg-muted)] ui:border-t ui:border-[var(--landing-border-soft)] ui:first:border-t-0"
                >
                  {#if item.kind === 'exercise'}
                    <ListChecksIcon class="ui:size-4 ui:shrink-0 ui:text-[var(--landing-fg-faint)] custom" />
                  {:else if item.kind === 'activity'}
                    <PackageIcon class="ui:size-4 ui:shrink-0 ui:text-[var(--landing-fg-faint)] custom" />
                  {:else}
                    <BookOpenTextIcon class="ui:size-4 ui:shrink-0 ui:text-[var(--landing-fg-faint)] custom" />
                  {/if}
                  <span class="ui:min-w-0 ui:truncate">{item.title}</span>
                  {#if item.durationMinutes}
                    <span class="ui:ml-auto ui:shrink-0 ui:text-[13px] ui:text-[var(--landing-fg-faint)]">
                      {labels?.lessonDurationLabel?.(item.durationMinutes) ?? `${item.durationMinutes} min`}
                    </span>
                  {/if}
                </div>
                {#if item.kind === 'activity'}
                  {#each item.modules ?? [] as module (module.id)}
                    <div
                      class="ui:flex ui:items-center ui:gap-3 ui:py-2 ui:pl-6 ui:text-[13.5px] ui:text-[var(--landing-fg-faint)] ui:border-t ui:border-[var(--landing-border-soft)]"
                    >
                      <span class="ui:min-w-0 ui:truncate">{module.title}</span>
                    </div>
                  {/each}
                {/if}
              {/each}
            </div>
          </details>
        {/if}
      {/each}
    </div>
  </QuartzCourseSection>
{/if}
