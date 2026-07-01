<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import type { Snippet } from 'svelte';
  import SecondaryActionButton from '../secondary-action-button.svelte';
  import { Button } from '../../../base/button';
  import { BlurIn } from '../../animation/blurin';
  import { DotPattern } from '../../animation/dot-pattern';
  import EditableLandingSection from '../editable-section.svelte';

  interface Props {
    hero: OrgLandingPageProps['hero'];
    showActions?: boolean;
    compact?: boolean;
    children?: Snippet;
  }

  let { hero, showActions = true, compact = false, children }: Props = $props();
</script>

<EditableLandingSection sectionKey="hero">
  <section
    class="ui:relative ui:bg-[var(--landing-fg)] ui:text-[var(--landing-bg)] ui:overflow-hidden {compact
      ? 'ui:py-12 ui:sm:py-16'
      : 'ui:py-24 ui:sm:py-32'} ui:px-6 ui:lg:px-8"
  >
    {#if hero.image}
      <div class="ui:absolute ui:inset-0 ui:opacity-10">
        <img src={hero.image} alt="Background" class="ui:w-full ui:h-full ui:object-cover ui:grayscale" />
      </div>
    {/if}
    <DotPattern fillColor="rgb(255 255 255 / 0.35)" class="ui:opacity-[0.06]" />
    <div class="ui:relative ui:max-w-3xl ui:mx-auto ui:text-center">
      <BlurIn
        class="ui:text-4xl ui:sm:text-5xl ui:lg:text-6xl ui:font-bold ui:tracking-tight ui:mb-6 ui:leading-tight ui:drop-shadow-none"
      >
        {hero.heading}
      </BlurIn>
      <p class="ui:text-lg ui:sm:text-xl ui:text-[var(--landing-bg)]/80 ui:mb-10">{hero.subheading}</p>
      {#if children}
        <div class="ui:flex ui:justify-center ui:w-full ui:mb-8">{@render children()}</div>
      {/if}
      {#if showActions}
        <div class="ui:flex ui:flex-col ui:sm:flex-row ui:justify-center ui:gap-4">
          <Button
            href={hero.primaryAction.href}
            disabled={hero.primaryAction.disabled ?? false}
            size="lg"
            class="ui:px-8 ui:font-semibold"
          >
            {hero.primaryAction.label}
          </Button>
          {#if hero.secondaryAction}
            <SecondaryActionButton
              href={hero.secondaryAction.href}
              label={hero.secondaryAction.label}
              variant="classic"
            />
          {/if}
        </div>
      {/if}
    </div>
  </section>
</EditableLandingSection>
