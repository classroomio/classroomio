<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import type { Snippet } from 'svelte';
  import SecondaryActionButton from '../secondary-action-button.svelte';
  import { Button } from '../../../base/button';
  import EditableLandingSection from '../editable-section.svelte';

  interface Props {
    hero: OrgLandingPageProps['hero'];
    labels?: OrgLandingPageProps['labels'];
    navigation: Snippet;
    showActions?: boolean;
    compact?: boolean;
    children?: Snippet;
  }

  let { hero, labels, navigation, showActions = true, compact = false, children }: Props = $props();
</script>

{@render navigation()}

<EditableLandingSection sectionKey="hero">
  <section
    class="ui:relative ui:px-6 ui:md:px-8 {compact
      ? 'ui:pt-10 ui:md:pt-12 ui:pb-10 ui:md:pb-12'
      : 'ui:pt-20 ui:md:pt-24 ui:pb-20 ui:md:pb-24'} ui:bg-[var(--landing-bg)] ui:text-center"
  >
    <div class="ui:max-w-[1320px] ui:mx-auto">
      <h1
        class="ui:text-[64px] ui:md:text-[88px] ui:lg:text-[110px] ui:font-medium ui:tracking-tight ui:text-[var(--landing-fg)] ui:m-0 ui:mb-7 ui:max-w-[1100px] ui:mx-auto ui:text-balance"
        style="line-height: 0.98; letter-spacing: -0.04em;"
      >
        {hero.heading}
      </h1>

      <p
        class="ui:text-lg ui:md:text-xl ui:lg:text-[22px] ui:text-[var(--landing-fg-muted)] ui:max-w-[640px] ui:mx-auto ui:m-0 ui:mb-10"
        style="line-height: 1.4; letter-spacing: -0.012em;"
      >
        {hero.subheading}
      </p>

      {#if children}
        <div class="ui:flex ui:justify-center ui:w-full ui:mb-8">{@render children()}</div>
      {/if}
      {#if showActions}
        <div class="ui:inline-flex ui:flex-wrap ui:justify-center ui:items-center ui:gap-3">
          <Button
            href={hero.primaryAction.href}
            disabled={hero.primaryAction.disabled ?? false}
            class="ui:rounded-md ui:px-7 ui:py-3.5 ui:text-base ui:font-medium ui:bg-[var(--landing-accent)] ui:text-[var(--landing-accent-fg)] ui:hover:opacity-90"
          >
            {hero.primaryAction.label}
          </Button>
          {#if hero.secondaryAction}
            <SecondaryActionButton
              href={hero.secondaryAction.href}
              label={hero.secondaryAction.label}
              variant="vibrant"
            />
          {/if}
        </div>
      {/if}
    </div>
  </section>

  <div
    aria-hidden="true"
    class="ui:h-[180px] ui:md:h-[220px]"
    style="
      background: linear-gradient(
        to bottom,
        var(--landing-bg) 0%,
        var(--landing-bg) 18%,
        color-mix(in oklab, var(--landing-accent) 12%, var(--landing-bg)) 38%,
        color-mix(in oklab, var(--landing-accent) 40%, var(--landing-bg)) 58%,
        color-mix(in oklab, var(--landing-accent) 78%, var(--landing-bg)) 78%,
        var(--landing-accent) 100%
      );
    "
  ></div>
</EditableLandingSection>
