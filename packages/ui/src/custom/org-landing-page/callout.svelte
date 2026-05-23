<script lang="ts">
  import type { LandingPageCallout, OrgLandingPageLabels, OrgLandingPageTheme } from './types';
  import { Button } from '../../base/button';
  import EditableLandingSection from './editable-section.svelte';

  let {
    callout,
    variant = 'minimal',
    labels
  }: {
    callout?: LandingPageCallout;
    variant?: OrgLandingPageTheme;
    labels?: OrgLandingPageLabels;
  } = $props();

  /** Per-variant default eyebrow used when labels.calloutEyebrow is not provided. */
  const defaultEyebrow = $derived<string | null>(
    variant === 'saas'
      ? 'Get started'
      : variant === 'tech'
        ? '// get started'
        : variant === 'studio' || variant === 'corporate' || variant === 'editorial'
          ? 'Ready when you are'
          : null
  );
  const resolvedEyebrow = $derived(labels?.calloutEyebrow ?? defaultEyebrow);

  const sectionClasses: Record<string, string> = {
    minimal: 'ui:py-20 ui:px-6',
    bold: 'ui:py-24 ui:px-6 ui:bg-[var(--landing-fg)] ui:text-[var(--landing-bg)]',
    classic: 'ui:py-20 ui:px-6 ui:bg-[var(--landing-fg)] ui:text-[var(--landing-bg)]',
    saas: 'ui:py-24 ui:md:py-28 ui:px-6 ui:relative ui:overflow-hidden',
    tech: 'ui:py-24 ui:px-6 ui:bg-[var(--landing-fg)] ui:text-[var(--landing-bg)]',
    studio:
      'ui:py-32 ui:px-6 ui:relative ui:overflow-hidden ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)] ui:border-t ui:border-[var(--landing-border)]',
    corporate:
      'ui:py-20 ui:px-6 ui:bg-[var(--landing-card-soft)]/40 ui:text-[var(--landing-fg)] ui:border-t ui:border-[var(--landing-border)]',
    terminal: 'ui:py-20 ui:px-6 ui:border-t ui:border-[#1c1f28] ui:text-[#e9eaed] ui:bg-[#06070a]',
    editorial: 'ui:py-32 ui:md:py-40 ui:px-6 ui:bg-[#e2e1d9] ui:text-[#1a1a1a]',
    vibrant: 'ui:py-32 ui:md:py-40 ui:px-6 ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)] ui:text-center'
  };

  const headingClasses: Record<string, string> = {
    minimal: 'ui:text-3xl ui:font-semibold ui:tracking-tight',
    bold: 'ui:text-4xl ui:lg:text-5xl ui:font-black ui:tracking-tighter',
    classic: 'ui:text-3xl ui:font-bold ui:tracking-tight',
    saas: 'ui:text-4xl ui:md:text-5xl ui:font-bold ui:tracking-tight ui:leading-[1.05]',
    tech: 'ui:text-4xl ui:lg:text-5xl ui:font-extrabold ui:tracking-tight',
    studio: 'ui:text-5xl ui:lg:text-6xl ui:font-semibold ui:tracking-tight ui:leading-[1.02]',
    corporate: 'ui:text-3xl ui:lg:text-4xl ui:font-semibold ui:tracking-tight',
    terminal: 'ui:text-[22px] ui:font-semibold ui:tracking-tight',
    editorial: 'ui:text-4xl ui:md:text-5xl ui:lg:text-[56px] ui:font-medium ui:tracking-tight ui:leading-[1.05]',
    vibrant: 'ui:text-5xl ui:md:text-6xl ui:lg:text-[80px] ui:font-medium ui:tracking-tight ui:leading-[1.02]'
  };

  const descriptionClasses: Record<string, string> = {
    minimal: 'ui:text-lg ui:text-[var(--landing-fg)]/70',
    bold: 'ui:text-xl ui:text-[var(--landing-bg)]/70',
    classic: 'ui:text-lg ui:text-[var(--landing-bg)]/80',
    saas: 'ui:text-base ui:md:text-lg ui:text-[var(--landing-fg-muted)] ui:max-w-xl ui:mx-auto',
    tech: 'ui:text-lg ui:text-[var(--landing-bg)]/70 ui:font-mono',
    studio: 'ui:text-base ui:text-[var(--landing-fg-muted)] ui:max-w-xl ui:mx-auto',
    corporate: 'ui:text-base ui:text-[var(--landing-fg-muted)] ui:max-w-xl ui:mx-auto',
    terminal: 'ui:text-sm ui:max-w-md ui:mx-auto ui:text-[#9da1ab]',
    editorial: 'ui:text-base ui:md:text-lg ui:text-[#76746c] ui:max-w-xl ui:mx-auto',
    vibrant: 'ui:text-lg ui:text-[var(--landing-fg-muted)] ui:max-w-xl ui:mx-auto'
  };

  const buttonClasses: Record<string, string> = {
    minimal: 'ui:rounded-full',
    bold: 'ui:rounded-xl ui:px-8 ui:py-6 ui:text-base ui:font-bold ui:shadow-lg ui:shadow-[var(--landing-accent)]/20',
    classic: 'ui:px-8 ui:font-semibold',
    saas: 'ui:rounded-full ui:px-7 ui:font-semibold ui:shadow-md ui:shadow-[var(--landing-accent)]/20',
    tech: 'ui:rounded-none ui:px-8 ui:font-semibold',
    studio: 'ui:rounded-md ui:px-5 ui:font-medium ui:shadow-lg ui:shadow-[var(--landing-accent)]/25',
    corporate: 'ui:rounded-none ui:px-8 ui:font-medium',
    terminal:
      'ui:rounded-full ui:px-4 ui:font-mono ui:text-[13px] ui:bg-[#0f1218] ui:text-[#e9eaed] ui:border ui:border-[#262a35] ui:hover:bg-[#14171f]',
    editorial:
      'ui:rounded-full ui:px-6 ui:font-medium ui:bg-[#1a1a1a] ui:text-[#fafaf5] ui:hover:bg-[#2c2b29] ui:transition-colors',
    vibrant:
      'ui:rounded-md ui:px-7 ui:py-3 ui:text-base ui:font-medium ui:bg-[var(--landing-accent)] ui:text-[var(--landing-accent-fg)] ui:hover:bg-[var(--landing-accent)]/90 ui:transition-colors'
  };

  const eyebrowClasses: Record<string, string> = {
    minimal: '',
    bold: '',
    classic: '',
    saas: 'ui:text-xs ui:font-semibold ui:tracking-widest ui:uppercase ui:text-[var(--landing-accent)] ui:mb-1',
    tech: 'ui:font-mono ui:text-xs ui:tracking-widest ui:uppercase ui:text-[var(--landing-bg)]/70 ui:mb-1',
    studio: 'ui:text-sm ui:text-[var(--landing-fg-muted)] ui:inline-flex ui:items-center ui:gap-2 ui:mb-2',
    corporate: 'ui:text-xs ui:font-semibold ui:tracking-widest ui:uppercase ui:text-[var(--landing-fg)] ui:mb-1',
    terminal: '',
    editorial: 'ui:text-sm ui:text-[#76746c] ui:mb-1',
    vibrant: ''
  };

  // Default eyebrow per variant is computed above as `defaultEyebrow`, resolved
  // into `resolvedEyebrow` (which prefers labels.calloutEyebrow when provided).

  const minimalBackground = `
    linear-gradient(
      135deg,
      color-mix(in oklab, var(--landing-accent) 10%, var(--landing-bg)) 0%,
      color-mix(in oklab, var(--landing-accent) 4%, var(--landing-bg)) 100%
    )
  `;
</script>

{#if callout}
  <EditableLandingSection sectionKey="callout">
    <section
      class={sectionClasses[variant]}
      style={variant === 'minimal' ? `background: ${minimalBackground};` : undefined}
    >
      {#if variant === 'studio'}
        <!-- soft radial glow at the bottom -->
        <div
          class="ui:pointer-events-none ui:absolute ui:left-1/2 ui:bottom-[-220px] ui:size-[800px] ui:-translate-x-1/2"
          style="background: radial-gradient(ellipse at center, color-mix(in oklab, var(--landing-accent) 28%, transparent) 0%, transparent 60%); filter: blur(40px);"
          aria-hidden="true"
        ></div>
      {/if}
      {#if variant === 'saas'}
        <!-- soft accent ring; the parent .frame already provides the dot grid + side lines -->
        <div
          class="ui:pointer-events-none ui:absolute ui:top-1/2 ui:left-1/2 ui:size-[640px] ui:-translate-x-1/2 ui:-translate-y-1/2 ui:opacity-60"
          style="background: radial-gradient(ellipse at center, color-mix(in oklab, var(--landing-accent) 14%, transparent) 0%, transparent 60%);"
          aria-hidden="true"
        ></div>
      {/if}

      <div class="ui:relative ui:mx-auto ui:flex ui:max-w-3xl ui:flex-col ui:items-center ui:gap-6 ui:text-center">
        {#if resolvedEyebrow}
          {#if variant === 'studio'}
            <p class={eyebrowClasses[variant]}>
              <span class="ui:size-1.5 ui:rounded-full ui:bg-[var(--landing-accent)]"></span>
              {resolvedEyebrow}
            </p>
          {:else}
            <p class={eyebrowClasses[variant]}>{resolvedEyebrow}</p>
          {/if}
        {/if}

        <h2 class={headingClasses[variant]}>{callout.heading}</h2>

        {#if callout.description}
          <p class={descriptionClasses[variant]}>{callout.description}</p>
        {/if}

        <Button
          href={callout.action.href}
          size="lg"
          class={buttonClasses[variant]}
          variant={variant === 'bold' || variant === 'classic' || variant === 'tech' ? 'secondary' : 'default'}
        >
          {callout.action.label}
        </Button>
      </div>
    </section>
  </EditableLandingSection>
{/if}
