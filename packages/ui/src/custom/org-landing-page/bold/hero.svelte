<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import type { Snippet } from 'svelte';
  import SecondaryActionButton from '../secondary-action-button.svelte';
  import CoursePrimaryAction from '../course-primary-action.svelte';
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
    class="{compact
      ? 'ui:py-5'
      : 'ui:py-10'} ui:px-6 ui:max-w-7xl ui:mx-auto ui:grid ui:lg:grid-cols-2 ui:gap-16 ui:items-center"
  >
    <div>
      <h1 class="ui:text-5xl ui:lg:text-7xl ui:font-black ui:leading-[1.1] ui:tracking-tighter">{hero.heading}</h1>
      <p class="ui:text-xl ui:text-[var(--landing-fg-muted)] ui:mb-10 ui:leading-relaxed">{hero.subheading}</p>
      {#if children}
        <div class="ui:mt-6">{@render children()}</div>
      {/if}
      {#if showActions}
        <div class="ui:flex ui:flex-wrap ui:gap-4">
          <CoursePrimaryAction
            action={hero.primaryAction}
            size="lg"
            class="ui:rounded-xl ui:px-8 ui:py-6 ui:text-base ui:font-bold ui:shadow-lg ui:shadow-[var(--landing-accent)]/20 ui:hover:-translate-y-1 ui:transition-all"
          />
          {#if hero.secondaryAction}
            <SecondaryActionButton href={hero.secondaryAction.href} label={hero.secondaryAction.label} variant="bold" />
          {/if}
        </div>
      {/if}
    </div>
    {#if hero.image}
      <div class="ui:relative">
        <div
          class="ui:absolute ui:inset-0 ui:bg-[var(--landing-accent)]/5 ui:rounded-3xl ui:translate-x-4 ui:translate-y-4"
        ></div>
        <img src={hero.image} alt="Hero" class="ui:relative ui:rounded-3xl ui:w-full ui:h-[500px] ui:object-cover" />
      </div>
    {/if}
  </section>
</EditableLandingSection>
