<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import type { Snippet } from 'svelte';
  import SecondaryActionButton from '../secondary-action-button.svelte';
  import { Button } from '../../../base/button';
  import EditableLandingSection from '../editable-section.svelte';

  interface Props {
    hero: OrgLandingPageProps['hero'];
    navigation: Snippet;
  }

  let { hero, navigation }: Props = $props();
</script>

<EditableLandingSection sectionKey="hero">
  <section class="ui:relative ui:px-6 ui:pt-4 ui:pb-20 ui:md:pb-24">
    <div class="ui:relative ui:max-w-[1180px] ui:mx-auto ui:sticky ui:top-4 ui:z-50">
      {@render navigation()}
    </div>

    <div class="ui:relative ui:max-w-[1180px] ui:mx-auto ui:pt-16 ui:md:pt-20 ui:text-center">
      <h1
        class="ui:text-4xl ui:md:text-5xl ui:lg:text-[56px] ui:font-bold ui:tracking-tight ui:leading-[1.05] ui:max-w-3xl ui:mx-auto ui:mb-5"
      >
        {hero.heading}
      </h1>

      <p
        class="ui:text-base ui:md:text-lg ui:text-[var(--landing-fg-muted)] ui:max-w-xl ui:mx-auto ui:mb-8 ui:leading-relaxed"
      >
        {hero.subheading}
      </p>

      <div class="ui:flex ui:items-center ui:justify-center ui:gap-2.5">
        <Button
          href={hero.primaryAction.href}
          disabled={hero.primaryAction.disabled ?? false}
          size="lg"
          class="ui:rounded-full ui:px-6"
        >
          {hero.primaryAction.label}
        </Button>
        {#if hero.secondaryAction}
          <SecondaryActionButton href={hero.secondaryAction.href} label={hero.secondaryAction.label} variant="saas" />
        {/if}
      </div>

      {#if hero.image}
        <div class="ui:mt-16 ui:max-w-4xl ui:mx-auto">
          <img
            src={hero.image}
            alt=""
            class="ui:w-full ui:h-auto ui:rounded-2xl ui:border ui:border-[var(--landing-border)] ui:shadow-[0_20px_60px_-30px_rgba(14,14,16,0.25)]"
          />
        </div>
      {/if}
    </div>
  </section>
</EditableLandingSection>
