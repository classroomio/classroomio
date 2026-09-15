<script lang="ts">
  import type { CourseInstructor, CourseSocialProof, CourseCurriculum, CourseLandingPageLabels } from '../types';

  interface Props {
    instructor: CourseInstructor;
    socialProof: CourseSocialProof;
    curriculum: CourseCurriculum;
    labels?: CourseLandingPageLabels;
  }

  let { instructor, socialProof, curriculum, labels }: Props = $props();

  const lessonCount = $derived(
    socialProof.lessons ?? curriculum.sections.reduce((total, section) => total + section.lessons.length, 0)
  );
  const exerciseCount = $derived(
    curriculum.sections.reduce((total, section) => total + (section.exerciseCount ?? 0), 0)
  );

  function lessonsLabel(count: number): string {
    return labels?.lessonsLabel?.(count) ?? `${count} ${count === 1 ? 'lesson' : 'lessons'}`;
  }

  function exercisesLabel(count: number): string {
    return labels?.exercisesLabel?.(count) ?? `${count} ${count === 1 ? 'exercise' : 'exercises'}`;
  }

  /** A single hairline row rather than a stat grid — the meta reads as a sentence. */
  const meta = $derived(
    [
      lessonCount > 0 ? lessonsLabel(lessonCount) : null,
      exerciseCount > 0 ? exercisesLabel(exerciseCount) : null,
      socialProof.type ?? null,
      socialProof.hasCertificate ? (labels?.socialProofCertificateLabel ?? 'Certificate') : null
    ].filter((entry) => entry !== null)
  );
</script>

<div class="ui:bg-[var(--landing-card)] ui:border-y ui:border-[var(--landing-border)]">
  <div
    class="ui:max-w-[1200px] ui:mx-auto ui:px-5 ui:md:px-8 ui:py-4 ui:flex ui:flex-wrap ui:items-center ui:justify-between ui:gap-x-6 ui:gap-y-2"
  >
    <span class="ui:flex ui:items-center ui:gap-2.5 ui:min-w-0">
      {#if instructor.imgUrl}
        <img src={instructor.imgUrl} alt="" class="ui:size-6 ui:rounded-full ui:object-cover ui:shrink-0" />
      {/if}
      <span class="ui:text-[13.5px] ui:text-[var(--landing-fg)] ui:truncate">{instructor.name}</span>
      {#if instructor.role}
        <span class="ui:text-[13.5px] ui:text-[var(--landing-fg-faint)] ui:truncate">· {instructor.role}</span>
      {/if}
    </span>

    {#if meta.length > 0}
      <span class="ui:text-[13.5px] ui:text-[var(--landing-fg-muted)]">{meta.join(' · ')}</span>
    {/if}
  </div>
</div>
