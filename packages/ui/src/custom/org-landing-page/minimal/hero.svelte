<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import type { Snippet } from 'svelte';
  import SecondaryActionButton from '../secondary-action-button.svelte';
  import { Button } from '../../../base/button';
  import { BlurFade } from '../../animation/blurfade';
  import { DotPattern } from '../../animation/dot-pattern';
  import { ShinnyText } from '../../animation/shinny-text';
  import EditableLandingSection from '../editable-section.svelte';

  interface Props {
    hero: OrgLandingPageProps['hero'];
    navigation: Snippet;
  }

  let { hero, navigation }: Props = $props();

  const heroGradientBackground = `
    radial-gradient(
      circle at top center,
      color-mix(in oklab, var(--primary) 24%, transparent) 0%,
      transparent 58%
    ),
    linear-gradient(
      135deg,
      color-mix(in oklab, var(--primary) 12%, var(--background)) 0%,
      color-mix(in oklab, var(--primary) 6%, var(--background)) 48%,
      var(--background) 100%
    )
  `;
</script>

<EditableLandingSection sectionKey="hero">
  <section
    class="ui:relative ui:overflow-hidden ui:px-4 ui:pt-4 ui:pb-16 ui:md:pb-24"
    style={`background: ${heroGradientBackground};`}
  >
    <DotPattern class="ui:opacity-[0.08]" />
    <div class="ui:relative ui:max-w-[1200px] ui:mx-auto">
      {@render navigation()}
    </div>

    <div class="ui:relative ui:py-20 ui:text-center ui:max-w-4xl ui:mx-auto">
      <BlurFade delay={0} once={true}>
        <h1 class="ui:text-5xl ui:md:text-6xl ui:font-semibold ui:tracking-tight ui:mb-6">{hero.heading}</h1>
      </BlurFade>
      <BlurFade delay={0.15} once={true}>
        <ShinnyText
          shimmerWidth={120}
          class="ui:text-xl ui:mb-10 ui:max-w-2xl ui:mx-auto ui:font-light ui:text-foreground/72"
        >
          {hero.subheading}
        </ShinnyText>
      </BlurFade>
      <BlurFade delay={0.3} once={true}>
        <div class="ui:flex ui:items-center ui:justify-center ui:gap-4">
          <Button
            href={hero.primaryAction.href}
            disabled={hero.primaryAction.disabled ?? false}
            size="lg"
            class="ui:rounded-full"
          >
            {hero.primaryAction.label}
          </Button>
          {#if hero.secondaryAction}
            <SecondaryActionButton
              href={hero.secondaryAction.href}
              label={hero.secondaryAction.label}
              variant="minimal"
            />
          {/if}
        </div>
      </BlurFade>
    </div>
  </section>
</EditableLandingSection>
