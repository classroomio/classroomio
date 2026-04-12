<script lang="ts">
  import type { LandingPageCallout } from './types';
  import { Button } from '../../base/button';
  import { BlurFade } from '../animation/blurfade';

  let { callout, variant = 'minimal' }: { callout?: LandingPageCallout; variant?: 'minimal' | 'bold' | 'classic' } =
    $props();

  const sectionClasses: Record<string, string> = {
    minimal: 'ui:py-20 ui:px-6',
    bold: 'ui:py-24 ui:px-6 ui:bg-foreground ui:text-background',
    classic: 'ui:py-20 ui:px-6 ui:bg-foreground ui:text-background'
  };

  const headingClasses: Record<string, string> = {
    minimal: 'ui:text-3xl ui:font-semibold ui:tracking-tight',
    bold: 'ui:text-4xl ui:lg:text-5xl ui:font-black ui:tracking-tighter',
    classic: 'ui:text-3xl ui:font-bold ui:tracking-tight'
  };

  const descriptionClasses: Record<string, string> = {
    minimal: 'ui:text-lg ui:text-foreground/70',
    bold: 'ui:text-xl ui:text-background/70',
    classic: 'ui:text-lg ui:text-background/80'
  };

  const buttonClasses: Record<string, string> = {
    minimal: 'ui:rounded-full',
    bold: 'ui:rounded-xl ui:px-8 ui:py-6 ui:text-base ui:font-bold ui:shadow-lg ui:shadow-primary/20',
    classic: 'ui:px-8 ui:font-semibold'
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
  <section
    class={sectionClasses[variant]}
    style={variant === 'minimal' ? `background: ${minimalBackground};` : undefined}
  >
    <div class="ui:mx-auto ui:flex ui:max-w-3xl ui:flex-col ui:items-center ui:gap-6 ui:text-center">
      <BlurFade delay={0} once={true}>
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
          variant={variant === 'bold' || variant === 'classic' ? 'secondary' : 'default'}
        >
          {callout.action.label}
        </Button>
      </BlurFade>
    </div>
  </section>
{/if}
