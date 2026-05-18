<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import SecondaryActionButton from '../secondary-action-button.svelte';
  import { Button } from '../../../base/button';
  import { BlurFade } from '../../animation/blurfade';
  import EditableLandingSection from '../editable-section.svelte';

  interface Props {
    hero: OrgLandingPageProps['hero'];
  }

  let { hero }: Props = $props();
</script>

<EditableLandingSection sectionKey="hero">
  <section class="ui:py-10 ui:px-6 ui:max-w-7xl ui:mx-auto ui:grid ui:lg:grid-cols-2 ui:gap-16 ui:items-center">
    <div>
      <BlurFade delay={0} once={true} class="ui:mb-6">
        <h1 class="ui:text-5xl ui:lg:text-7xl ui:font-black ui:leading-[1.1] ui:tracking-tighter">{hero.heading}</h1>
      </BlurFade>
      <BlurFade delay={0.15} once={true}>
        <p class="ui:text-xl ui:text-muted-foreground ui:mb-10 ui:leading-relaxed">{hero.subheading}</p>
      </BlurFade>
      <BlurFade delay={0.3} once={true}>
        <div class="ui:flex ui:flex-wrap ui:gap-4">
          <Button
            href={hero.primaryAction.href}
            disabled={hero.primaryAction.disabled ?? false}
            size="lg"
            class="ui:rounded-xl ui:px-8 ui:py-6 ui:text-base ui:font-bold ui:shadow-lg ui:shadow-primary/20 ui:hover:-translate-y-1 ui:transition-all"
          >
            {hero.primaryAction.label}
          </Button>
          {#if hero.secondaryAction}
            <SecondaryActionButton href={hero.secondaryAction.href} label={hero.secondaryAction.label} variant="bold" />
          {/if}
        </div>
      </BlurFade>
    </div>
    {#if hero.image}
      <BlurFade delay={0.2} once={true} class="ui:relative ui:hidden ui:lg:block">
        <div
          class="ui:absolute ui:inset-0 ui:bg-primary/5 ui:rounded-3xl ui:transform ui:translate-x-4 ui:translate-y-4"
        ></div>
        <img src={hero.image} alt="Hero" class="ui:relative ui:rounded-3xl ui:w-full ui:h-[500px] ui:object-cover" />
      </BlurFade>
    {/if}
  </section>
</EditableLandingSection>
