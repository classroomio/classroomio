<script lang="ts">
  import type { LandingPageCallout, OrgLandingPageTheme } from './types';
  import { Button } from '../../base/button';
  import { BlurFade } from '../animation/blurfade';
  import EditableLandingSection from './editable-section.svelte';

  let { callout, variant = 'minimal' }: { callout?: LandingPageCallout; variant?: OrgLandingPageTheme } = $props();

  const sectionClasses: Record<string, string> = {
    minimal: 'ui:py-20 ui:px-6',
    bold: 'ui:py-24 ui:px-6 ui:bg-foreground ui:text-background',
    classic: 'ui:py-20 ui:px-6 ui:bg-foreground ui:text-background',
    saas: 'ui:py-24 ui:md:py-28 ui:px-6 ui:relative ui:overflow-hidden',
    tech: 'ui:py-24 ui:px-6 ui:bg-foreground ui:text-background',
    studio:
      'ui:py-32 ui:px-6 ui:relative ui:overflow-hidden ui:bg-background ui:text-foreground ui:border-t ui:border-border',
    corporate: 'ui:py-20 ui:px-6 ui:bg-muted/40 ui:text-foreground ui:border-t ui:border-border',
    terminal: 'ui:py-20 ui:px-6 ui:border-t ui:border-[#1c1f28] ui:text-[#e9eaed] ui:bg-[#06070a]'
  };

  const headingClasses: Record<string, string> = {
    minimal: 'ui:text-3xl ui:font-semibold ui:tracking-tight',
    bold: 'ui:text-4xl ui:lg:text-5xl ui:font-black ui:tracking-tighter',
    classic: 'ui:text-3xl ui:font-bold ui:tracking-tight',
    saas: 'ui:text-4xl ui:md:text-5xl ui:font-bold ui:tracking-tight ui:leading-[1.05]',
    tech: 'ui:text-4xl ui:lg:text-5xl ui:font-extrabold ui:tracking-tight',
    studio: 'ui:text-5xl ui:lg:text-6xl ui:font-semibold ui:tracking-tight ui:leading-[1.02]',
    corporate: 'ui:text-3xl ui:lg:text-4xl ui:font-semibold ui:tracking-tight',
    terminal: 'ui:text-[22px] ui:font-semibold ui:tracking-tight'
  };

  const descriptionClasses: Record<string, string> = {
    minimal: 'ui:text-lg ui:text-foreground/70',
    bold: 'ui:text-xl ui:text-background/70',
    classic: 'ui:text-lg ui:text-background/80',
    saas: 'ui:text-base ui:md:text-lg ui:text-muted-foreground ui:max-w-xl ui:mx-auto',
    tech: 'ui:text-lg ui:text-background/70 ui:font-mono',
    studio: 'ui:text-base ui:text-muted-foreground ui:max-w-xl ui:mx-auto',
    corporate: 'ui:text-base ui:text-muted-foreground ui:max-w-xl ui:mx-auto',
    terminal: 'ui:text-sm ui:max-w-md ui:mx-auto ui:text-[#9da1ab]'
  };

  const buttonClasses: Record<string, string> = {
    minimal: 'ui:rounded-full',
    bold: 'ui:rounded-xl ui:px-8 ui:py-6 ui:text-base ui:font-bold ui:shadow-lg ui:shadow-primary/20',
    classic: 'ui:px-8 ui:font-semibold',
    saas: 'ui:rounded-full ui:px-7 ui:font-semibold ui:shadow-md ui:shadow-primary/20',
    tech: 'ui:rounded-none ui:px-8 ui:font-semibold',
    studio: 'ui:rounded-md ui:px-5 ui:font-medium ui:shadow-lg ui:shadow-primary/25',
    corporate: 'ui:rounded-none ui:px-8 ui:font-medium',
    terminal:
      'ui:rounded-full ui:px-4 ui:font-mono ui:text-[13px] ui:bg-[#0f1218] ui:text-[#e9eaed] ui:border ui:border-[#262a35] ui:hover:bg-[#14171f]'
  };

  const eyebrowClasses: Record<string, string> = {
    minimal: '',
    bold: '',
    classic: '',
    saas: 'ui:text-xs ui:font-semibold ui:tracking-widest ui:uppercase ui:text-primary ui:mb-1',
    tech: 'ui:font-mono ui:text-xs ui:tracking-widest ui:uppercase ui:text-background/70 ui:mb-1',
    studio: 'ui:text-sm ui:text-muted-foreground ui:inline-flex ui:items-center ui:gap-2 ui:mb-2',
    corporate: 'ui:text-xs ui:font-semibold ui:tracking-widest ui:uppercase ui:text-foreground ui:mb-1',
    terminal: ''
  };

  const eyebrowLabels: Record<string, string | null> = {
    minimal: null,
    bold: null,
    classic: null,
    saas: 'Get started',
    tech: '// get started',
    studio: 'Ready when you are',
    corporate: 'Ready when you are',
    terminal: null
  };

  const minimalBackground = `
    linear-gradient(
      135deg,
      color-mix(in oklab, var(--primary) 10%, var(--background)) 0%,
      color-mix(in oklab, var(--primary) 4%, var(--background)) 100%
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
          style="background: radial-gradient(ellipse at center, color-mix(in oklab, var(--primary) 28%, transparent) 0%, transparent 60%); filter: blur(40px);"
          aria-hidden="true"
        ></div>
      {/if}
      {#if variant === 'saas'}
        <!-- soft accent ring; the parent .frame already provides the dot grid + side lines -->
        <div
          class="ui:pointer-events-none ui:absolute ui:top-1/2 ui:left-1/2 ui:size-[640px] ui:-translate-x-1/2 ui:-translate-y-1/2 ui:opacity-60"
          style="background: radial-gradient(ellipse at center, color-mix(in oklab, var(--primary) 14%, transparent) 0%, transparent 60%);"
          aria-hidden="true"
        ></div>
      {/if}

      <div class="ui:relative ui:mx-auto ui:flex ui:max-w-3xl ui:flex-col ui:items-center ui:gap-6 ui:text-center">
        {#if eyebrowLabels[variant]}
          <BlurFade delay={0} once={true}>
            {#if variant === 'studio'}
              <p class={eyebrowClasses[variant]}>
                <span class="ui:size-1.5 ui:rounded-full ui:bg-primary"></span>
                {eyebrowLabels[variant]}
              </p>
            {:else}
              <p class={eyebrowClasses[variant]}>{eyebrowLabels[variant]}</p>
            {/if}
          </BlurFade>
        {/if}

        <BlurFade delay={0.05} once={true}>
          <h2 class={headingClasses[variant]}>{callout.heading}</h2>
        </BlurFade>

        {#if callout.description}
          <BlurFade delay={0.15} once={true}>
            <p class={descriptionClasses[variant]}>{callout.description}</p>
          </BlurFade>
        {/if}

        <BlurFade delay={0.3} once={true}>
          <Button
            href={callout.action.href}
            size="lg"
            class={buttonClasses[variant]}
            variant={variant === 'bold' || variant === 'classic' || variant === 'tech' ? 'secondary' : 'default'}
          >
            {callout.action.label}
          </Button>
        </BlurFade>
      </div>
    </section>
  </EditableLandingSection>
{/if}
