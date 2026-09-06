<script lang="ts">
  import type { CourseInfoBlocks, CourseLandingPageLabels } from '../types';
  import SafeHtmlContent from '../../safe-html-content/safe-html-content.svelte';
  import QuartzCourseSection from './course-section.svelte';

  interface Props {
    info: CourseInfoBlocks;
    labels?: CourseLandingPageLabels;
  }

  let { info, labels }: Props = $props();

  /** Stacked ruled sections, one per authored block — not a side-by-side grid. */
  const blocks = $derived(
    [
      info.description
        ? {
            id: 'about',
            key: 'description' as const,
            eyebrow: labels?.infoDescriptionEyebrow ?? 'Overview',
            heading: labels?.infoDescriptionHeading ?? 'About this course',
            html: info.description
          }
        : null,
      info.goals
        ? {
            id: 'goals',
            key: 'goals' as const,
            eyebrow: labels?.infoGoalsEyebrow ?? 'Outcomes',
            heading: labels?.infoGoalsHeading ?? 'What you will learn',
            html: info.goals
          }
        : null,
      info.requirements
        ? {
            id: 'requirements',
            key: 'requirement' as const,
            eyebrow: labels?.infoRequirementsEyebrow ?? 'Before you start',
            heading: labels?.infoRequirementsHeading ?? 'Requirements',
            html: info.requirements
          }
        : null
    ].filter((block) => block !== null)
  );
</script>

{#each blocks as block (block.id)}
  <QuartzCourseSection id={block.id} sectionKey={block.key} eyebrow={block.eyebrow} heading={block.heading}>
    <div
      class="ui:max-w-[64ch] ui:text-base ui:leading-relaxed ui:text-[var(--landing-fg-muted)] ui:[&_p]:m-0 ui:[&_p+p]:mt-3.5 ui:[&_ul]:m-0 ui:[&_ul]:mt-1 ui:[&_ul]:pl-5 ui:[&_ul]:list-disc ui:[&_li]:mt-1.5 ui:[&_ol]:m-0 ui:[&_ol]:mt-1 ui:[&_ol]:pl-5 ui:[&_ol]:list-decimal"
    >
      <SafeHtmlContent content={block.html} />
    </div>
  </QuartzCourseSection>
{/each}

{#if info.certificateUrl}
  <QuartzCourseSection
    id="certificate"
    sectionKey="certificate"
    eyebrow={labels?.infoCertificateEyebrow ?? 'On completion'}
    heading={labels?.infoCertificateHeading ?? 'Your certificate'}
  >
    <figure
      class="ui:m-0 ui:max-w-[420px] ui:border ui:border-[var(--landing-border)] ui:bg-[var(--landing-card-soft)]"
    >
      <img src={info.certificateUrl} alt="" class="ui:block ui:w-full ui:h-auto" />
    </figure>
  </QuartzCourseSection>
{/if}
