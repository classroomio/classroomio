<script lang="ts">
  import type { CourseInstructor, CourseLandingPageLabels } from '../types';
  import SafeHtmlContent from '../../safe-html-content/safe-html-content.svelte';
  import QuartzCourseSection from './course-section.svelte';

  interface Props {
    instructor: CourseInstructor;
    labels?: CourseLandingPageLabels;
  }

  let { instructor, labels }: Props = $props();
</script>

{#if instructor.name}
  <QuartzCourseSection
    id="instructor"
    sectionKey="instructor"
    eyebrow={labels?.instructorEyebrow ?? 'Your instructor'}
    heading={labels?.instructorHeading ?? 'Taught by a practitioner'}
  >
    <div class="ui:flex ui:gap-5">
      {#if instructor.imgUrl}
        <img src={instructor.imgUrl} alt="" class="ui:size-14 ui:shrink-0 ui:rounded-[14px] ui:object-cover" />
      {:else}
        <span class="ui:size-14 ui:shrink-0 ui:rounded-[14px] ui:bg-[var(--landing-card-soft)]"></span>
      {/if}
      <div class="ui:min-w-0">
        <h3
          class="ui:m-0 ui:text-[17px] ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)] ui:[letter-spacing:var(--landing-heading-tracking)]"
        >
          {instructor.name}
        </h3>
        {#if instructor.role}
          <p class="ui:m-0 ui:mt-1 ui:text-[13.5px] ui:text-[var(--landing-fg-muted)]">{instructor.role}</p>
        {/if}
        {#if instructor.coursesNo}
          <p class="ui:m-0 ui:mt-1 ui:text-[13.5px] ui:text-[var(--landing-fg-faint)]">
            {labels?.instructorCoursesLabel?.(instructor.coursesNo) ?? `${instructor.coursesNo} courses`}
          </p>
        {/if}
        {#if instructor.description}
          <div
            class="ui:mt-3 ui:max-w-[62ch] ui:text-[15px] ui:leading-relaxed ui:text-[var(--landing-fg-muted)] ui:[&_p]:m-0 ui:[&_p+p]:mt-2"
          >
            <SafeHtmlContent content={instructor.description} />
          </div>
        {/if}
      </div>
    </div>
  </QuartzCourseSection>
{/if}
