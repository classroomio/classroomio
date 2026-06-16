<script lang="ts">
  import type { CourseInfoBlocks, CourseLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
  import EditableLandingSection from './editable-section.svelte';
  import AwardIcon from '@lucide/svelte/icons/award';
  import SafeHtmlContent from '../safe-html-content/safe-html-content.svelte';

  interface Props {
    variant: OrgLandingPageTheme;
    info: CourseInfoBlocks;
    labels?: CourseLandingPageLabels;
  }

  let { variant, info, labels }: Props = $props();

  const t = $derived(courseLandingTokens(variant));

  type InfoLayout = 'prose-grid' | 'cards' | 'mono-blocks' | 'editorial' | 'oversized';

  const layoutByTheme: Record<OrgLandingPageTheme, InfoLayout> = {
    minimal: 'prose-grid',
    bold: 'cards',
    classic: 'prose-grid',
    saas: 'prose-grid',
    tech: 'mono-blocks',
    studio: 'cards',
    corporate: 'prose-grid',
    terminal: 'mono-blocks',
    editorial: 'editorial',
    vibrant: 'oversized'
  };

  const layout = $derived<InfoLayout>(layoutByTheme[variant] ?? 'prose-grid');

  type BlockKey = 'requirement' | 'description' | 'goals';
  type Block = { id: BlockKey; eyebrow: string; heading: string; html: string; monoLabel: string };

  const blocks = $derived(
    [
      info.requirements
        ? {
            id: 'requirement' as const,
            eyebrow: labels?.infoRequirementsEyebrow ?? 'Before you start',
            heading: labels?.infoRequirementsHeading ?? 'Requirements',
            html: info.requirements,
            monoLabel: '01_requirements.md'
          }
        : null,
      info.description
        ? {
            id: 'description' as const,
            eyebrow: labels?.infoDescriptionEyebrow ?? 'About this course',
            heading: labels?.infoDescriptionHeading ?? 'What you will learn',
            html: info.description,
            monoLabel: '02_about.md'
          }
        : null,
      info.goals
        ? {
            id: 'goals' as const,
            eyebrow: labels?.infoGoalsEyebrow ?? 'Outcomes',
            heading: labels?.infoGoalsHeading ?? 'Goals',
            html: info.goals,
            monoLabel: '03_goals.md'
          }
        : null
    ].filter(Boolean) as Block[]
  );

  const certCaption = 'Awarded on completion. Shareable on LinkedIn with a verification link auditors can follow.';
</script>

{#if blocks.length > 0 || info.certificateUrl}
  <section id="course-info" class={t.sectionShell}>
    <div class={t.sectionInner}>
      {#if layout === 'prose-grid'}
        <div class={t.infoGrid}>
          {#each blocks as block (block.id)}
            <EditableLandingSection sectionKey={block.id}>
              <article id={block.id} class={t.infoBlock}>
                <span class={t.infoBlockEyebrow}>{block.eyebrow}</span>
                <h2 class={t.infoBlockHeading}>{block.heading}</h2>
                <div class={t.infoBlockBody}><SafeHtmlContent content={block.html} /></div>
              </article>
            </EditableLandingSection>
          {/each}
        </div>
      {:else if layout === 'cards'}
        <div class="ui:grid ui:grid-cols-1 ui:gap-6">
          {#each blocks as block (block.id)}
            <EditableLandingSection sectionKey={block.id}>
              <article id={block.id} class={t.infoBlock}>
                <span class={t.infoBlockEyebrow}>{block.eyebrow}</span>
                <h2 class={t.infoBlockHeading}>{block.heading}</h2>
                <div class={t.infoBlockBody}><SafeHtmlContent content={block.html} /></div>
              </article>
            </EditableLandingSection>
          {/each}
        </div>
      {:else if layout === 'mono-blocks'}
        <div class="ui:flex ui:flex-col ui:gap-6">
          {#each blocks as block (block.id)}
            <EditableLandingSection sectionKey={block.id}>
              <article
                id={block.id}
                class={`ui:border ui:border-[var(--landing-border)] ${variant === 'terminal' ? 'ui:bg-[var(--landing-card)]' : ''}`}
              >
                <div
                  class={`ui:flex ui:items-center ui:justify-between ui:px-4 ui:py-2 ui:border-b ui:border-[var(--landing-border)] ${variant === 'terminal' ? 'ui:bg-[var(--landing-bg-section)]' : ''}`}
                >
                  <span class="ui:text-xs ui:font-mono ui:text-[var(--landing-fg-muted)]">
                    // {block.monoLabel}
                  </span>
                  <span class={t.infoBlockEyebrow}>{block.eyebrow}</span>
                </div>
                <div class="ui:p-6">
                  <h2 class={`${t.infoBlockHeading} ui:mb-3`}>{block.heading}</h2>
                  <div class={t.infoBlockBody}><SafeHtmlContent content={block.html} /></div>
                </div>
              </article>
            </EditableLandingSection>
          {/each}
        </div>
      {:else if layout === 'editorial'}
        <div class="ui:flex ui:flex-col ui:gap-16">
          {#each blocks as block, idx (block.id)}
            <EditableLandingSection sectionKey={block.id}>
              <article
                id={block.id}
                class="ui:grid ui:grid-cols-1 ui:md:grid-cols-[180px_1fr] ui:gap-8 ui:items-start ui:pt-10 ui:border-t ui:border-[var(--landing-border)]"
              >
                <div class="ui:flex ui:flex-col ui:gap-1">
                  <span class={t.infoBlockEyebrow}>{block.eyebrow}</span>
                  <span
                    class="ui:text-3xl ui:text-[var(--landing-accent)] ui:[font-weight:var(--landing-heading-weight)]"
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                <div>
                  <h2 class={`${t.infoBlockHeading} ui:mb-4`}>{block.heading}</h2>
                  <div class={t.infoBlockBody}><SafeHtmlContent content={block.html} /></div>
                </div>
              </article>
            </EditableLandingSection>
          {/each}
        </div>
      {:else if layout === 'oversized'}
        <div class="ui:flex ui:flex-col ui:gap-20">
          {#each blocks as block (block.id)}
            <EditableLandingSection sectionKey={block.id}>
              <article id={block.id} class="ui:grid ui:grid-cols-1 ui:md:grid-cols-[1fr_2fr] ui:gap-10">
                <div>
                  <span class={t.infoBlockEyebrow}>{block.eyebrow}</span>
                  <h2 class={`${t.infoBlockHeading} ui:mt-2`}>{block.heading}</h2>
                </div>
                <div class={t.infoBlockBody}><SafeHtmlContent content={block.html} /></div>
              </article>
            </EditableLandingSection>
          {/each}
        </div>
      {/if}

      {#if info.certificateUrl}
        <EditableLandingSection sectionKey="certificate">
          <div id="certificate" class="ui:mt-16">
            <div class={t.sectionHeader}>
              <span class={t.eyebrow}>{labels?.infoCertificateEyebrow ?? 'On completion'}</span>
              <h2 class={t.heading}>{labels?.infoCertificateHeading ?? 'Your certificate'}</h2>
              <span class={t.headingRule} aria-hidden="true"></span>
            </div>

            <div
              class={`${t.certificateShell} ui:grid ui:grid-cols-1 ui:md:grid-cols-[260px_1fr] ui:gap-8 ui:items-center`}
            >
              <div class={t.certificateFrame}>
                <img
                  src={info.certificateUrl}
                  alt="Certificate template preview"
                  class="ui:w-full ui:h-auto ui:block"
                  loading="lazy"
                />
              </div>
              <div class="ui:flex ui:flex-col ui:gap-3">
                <div class="ui:flex ui:items-center ui:gap-2 ui:text-[var(--landing-accent)]">
                  <AwardIcon class="ui:size-5" />
                  <span class={t.infoBlockEyebrow}>Verifiable credential</span>
                </div>
                <p class={t.infoBlockBody}>{certCaption}</p>
                <ul class="ui:flex ui:flex-col ui:gap-1.5 ui:text-sm ui:text-[var(--landing-fg)]">
                  <li class="ui:flex ui:items-center ui:gap-2">
                    <span class="ui:size-1 ui:[border-radius:9999px] ui:bg-[var(--landing-accent)]"></span>
                    Issued the day you finish the capstone
                  </li>
                  <li class="ui:flex ui:items-center ui:gap-2">
                    <span class="ui:size-1 ui:[border-radius:9999px] ui:bg-[var(--landing-accent)]"></span>
                    Shareable on LinkedIn with one click
                  </li>
                  <li class="ui:flex ui:items-center ui:gap-2">
                    <span class="ui:size-1 ui:[border-radius:9999px] ui:bg-[var(--landing-accent)]"></span>
                    Carries a verification URL for auditors
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </EditableLandingSection>
      {/if}
    </div>
  </section>
{/if}
