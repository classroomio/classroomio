<script lang="ts">
  import type { CourseCurriculum, CourseLandingPageLabels } from '../types';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import QuartzCourseSection from './course-section.svelte';

  interface Props {
    curriculum: CourseCurriculum;
    labels?: CourseLandingPageLabels;
  }

  let { curriculum, labels }: Props = $props();

  const lessonTotal = $derived(curriculum.sections.reduce((total, section) => total + section.lessons.length, 0));

  /** The lesson-count callback is already localized; no extra English connective is added. */
  const heading = $derived(
    labels?.lessonsLabel?.(lessonTotal) ?? `${lessonTotal} ${lessonTotal === 1 ? 'lesson' : 'lessons'}`
  );

  function sectionMeta(lessonCount: number, exerciseCount?: number): string {
    const lessons = labels?.lessonsLabel?.(lessonCount) ?? `${lessonCount} ${lessonCount === 1 ? 'lesson' : 'lessons'}`;
    if (!exerciseCount) return lessons;

    const exercises =
      labels?.exercisesLabel?.(exerciseCount) ?? `${exerciseCount} ${exerciseCount === 1 ? 'exercise' : 'exercises'}`;

    return `${lessons} · ${exercises}`;
  }
</script>

{#if curriculum.sections.length > 0}
  <QuartzCourseSection
    id="curriculum"
    sectionKey="curriculum"
    eyebrow={labels?.curriculumEyebrow ?? 'Curriculum'}
    heading={labels?.curriculumHeading ?? heading}
  >
    <div class="ui:border-t ui:border-[var(--landing-border)]">
      {#each curriculum.sections as section, index (section.id)}
        <!-- Native disclosure: no component state to drift out of sync with the curriculum prop. -->
        <details class="ui:group" open={index === 0}>
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
              {sectionMeta(section.lessons.length, section.exerciseCount)}
            </span>
            <ChevronDownIcon
              class="ui:size-4 ui:shrink-0 ui:text-[var(--landing-fg-faint)] ui:transition-transform ui:group-open:rotate-180"
            />
          </summary>

          <div class="ui:pl-9 ui:pb-3 ui:border-b ui:border-[var(--landing-border)]">
            {#each section.lessons as lesson (lesson.id)}
              <div
                class="ui:flex ui:items-center ui:gap-3 ui:py-2.5 ui:text-[14.5px] ui:text-[var(--landing-fg-muted)] ui:border-t ui:border-[var(--landing-border-soft)] ui:first:border-t-0"
              >
                <span class="ui:min-w-0 ui:truncate">{lesson.title}</span>
                {#if lesson.durationMinutes}
                  <span class="ui:ml-auto ui:shrink-0 ui:text-[13px] ui:text-[var(--landing-fg-faint)]">
                    {labels?.lessonDurationLabel?.(lesson.durationMinutes) ?? `${lesson.durationMinutes} min`}
                  </span>
                {/if}
              </div>
            {/each}
          </div>
        </details>
      {/each}
    </div>
  </QuartzCourseSection>
{/if}
