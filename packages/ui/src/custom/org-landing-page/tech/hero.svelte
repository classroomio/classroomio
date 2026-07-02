<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import type { Snippet } from 'svelte';
  import SecondaryActionButton from '../secondary-action-button.svelte';
  import { Button } from '../../../base/button';
  import EditableLandingSection from '../editable-section.svelte';

  interface Props {
    hero: OrgLandingPageProps['hero'];
    navigation: Snippet;
    showActions?: boolean;
    compact?: boolean;
    children?: Snippet;
  }

  let { hero, navigation, showActions = true, compact = false, children }: Props = $props();
</script>

<EditableLandingSection sectionKey="hero">
  <section
    class="ui:relative ui:bg-[var(--landing-accent)] ui:text-[var(--landing-accent-fg)] ui:overflow-hidden ui:px-6 ui:pt-2 {compact
      ? 'ui:pb-10'
      : 'ui:pb-20'}"
  >
    <!-- subtle grid overlay -->
    <div
      class="ui:pointer-events-none ui:absolute ui:inset-0 ui:opacity-[0.08]"
      style="background-image: linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px); background-size: 56px 56px;"
      aria-hidden="true"
    ></div>

    <div class="ui:relative ui:max-w-[1280px] ui:mx-auto">
      {@render navigation()}
    </div>

    <div
      class="ui:relative ui:max-w-[1280px] ui:mx-auto {compact
        ? 'ui:py-8 ui:lg:py-12'
        : 'ui:py-16 ui:lg:py-24'} ui:grid ui:lg:grid-cols-2 ui:gap-12 ui:items-center"
    >
      <div>
        <p
          class="ui:inline-block ui:font-mono ui:text-xs ui:tracking-widest ui:uppercase ui:text-[var(--landing-accent-fg)]/80 ui:bg-[var(--landing-accent-fg)]/10 ui:px-3 ui:py-1.5 ui:mb-6"
        >
          // engineering academy
        </p>
        <h1 class="ui:text-5xl ui:lg:text-7xl ui:font-extrabold ui:tracking-tight ui:leading-[0.95] ui:mb-6">
          {hero.heading}
        </h1>
        <p
          class="ui:text-lg ui:lg:text-xl ui:text-[var(--landing-accent-fg)]/80 ui:max-w-xl ui:mb-8 ui:leading-relaxed"
        >
          {hero.subheading}
        </p>
        {#if children}
          <div class="ui:mt-6">{@render children()}</div>
        {/if}
        {#if showActions}
          <div class="ui:flex ui:flex-wrap ui:items-center ui:gap-3">
            <Button
              href={hero.primaryAction.href}
              disabled={hero.primaryAction.disabled ?? false}
              size="lg"
              variant="secondary"
              class="ui:rounded-none ui:px-7 ui:font-semibold ui:bg-[var(--landing-accent-fg)] ui:text-[var(--landing-accent)] ui:hover:bg-[var(--landing-accent-fg)]/90"
            >
              {hero.primaryAction.label}
            </Button>
            {#if hero.secondaryAction}
              <SecondaryActionButton
                href={hero.secondaryAction.href}
                label={hero.secondaryAction.label}
                variant="tech"
              />
            {/if}
          </div>
        {/if}
      </div>

      {#if hero.image}
        <div class="ui:relative">
          <div
            class="ui:absolute ui:inset-0 ui:bg-[var(--landing-accent-fg)]/10 ui:translate-x-3 ui:translate-y-3"
          ></div>
          <img
            src={hero.image}
            alt=""
            class="ui:relative ui:w-full ui:h-[460px] ui:object-cover ui:border ui:border-[var(--landing-accent-fg)]/20"
          />
        </div>
      {/if}
    </div>
  </section>
</EditableLandingSection>
