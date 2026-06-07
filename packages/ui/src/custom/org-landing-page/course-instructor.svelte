<script lang="ts">
  import type { CourseInstructor, CourseLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
  import EditableLandingSection from './editable-section.svelte';

  interface Props {
    variant: OrgLandingPageTheme;
    instructor: CourseInstructor;
    labels?: CourseLandingPageLabels;
  }

  let { variant, instructor, labels }: Props = $props();

  const t = $derived(courseLandingTokens(variant));

  const fallbackAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(instructor.name);
  const coursesLabel = $derived(
    instructor.coursesNo
      ? (labels?.instructorCoursesLabel?.(instructor.coursesNo) ?? `${instructor.coursesNo} courses on the platform`)
      : null
  );

  const hasName = $derived(Boolean(instructor.name?.trim()));
</script>

{#if hasName}
  <EditableLandingSection sectionKey="instructor">
    <section id="instructor" class={t.sectionShell}>
      <div class={t.sectionInner}>
        <div class={t.sectionHeader}>
          <span class={t.eyebrow}>{labels?.instructorEyebrow ?? 'Your instructor'}</span>
          <h2 class={t.heading}>{labels?.instructorHeading ?? 'Taught by a practitioner'}</h2>
          <span class={t.headingRule} aria-hidden="true"></span>
        </div>

        <div class={t.instructorShell}>
          <div class={t.instructorAvatarWrap}>
            <img
              src={instructor.imgUrl ?? fallbackAvatar}
              alt={instructor.name}
              class={t.instructorAvatar}
              loading="lazy"
            />
          </div>

          <div class={t.instructorBodyWrap}>
            <h3 class={t.instructorName}>{instructor.name}</h3>
            {#if instructor.role}
              <p class={t.instructorRole}>{instructor.role}</p>
            {/if}
            {#if coursesLabel}
              <p class={t.instructorMeta}>{coursesLabel}</p>
            {/if}
            {#if instructor.description}
              <p class={t.instructorBody}>{instructor.description}</p>
            {/if}
          </div>
        </div>
      </div>
    </section>
  </EditableLandingSection>
{/if}
