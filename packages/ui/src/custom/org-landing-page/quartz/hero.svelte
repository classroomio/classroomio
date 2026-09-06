<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { OrgLandingPageProps } from '../types';
  import LandingButton from '../landing-button.svelte';
  import SecondaryActionButton from '../secondary-action-button.svelte';
  import CoursePrimaryAction from '../course-primary-action.svelte';
  import EditableLandingSection from '../editable-section.svelte';

  interface Props {
    hero: OrgLandingPageProps['hero'];
    navigation?: Snippet;
    showActions?: boolean;
    compact?: boolean;
    /** Org pages read left-aligned; the course page centres the same hero. */
    align?: 'start' | 'center';
    children?: Snippet;
  }

  let { hero, navigation, showActions = true, compact = false, align = 'start', children }: Props = $props();

  const centered = $derived(align === 'center');
</script>

{#if navigation}
  {@render navigation()}
{/if}

<EditableLandingSection sectionKey="hero">
  <header class="ui:bg-[var(--landing-bg)]">
    <div class="ui:max-w-[1200px] ui:mx-auto ui:px-5 ui:md:px-8 {compact ? 'ui:pt-10 ui:pb-8' : 'ui:pt-16 ui:pb-10'}">
      <h1
        class="ui:m-0 ui:text-[clamp(2rem,4.4vw,3.125rem)] ui:leading-[1.06] ui:max-w-[20ch] ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)] ui:[letter-spacing:var(--landing-heading-tracking)] {centered
          ? 'ui:mx-auto ui:text-center'
          : ''}"
      >
        {hero.heading}
      </h1>

      {#if hero.subheading}
        <p
          class="ui:m-0 ui:mt-5 ui:max-w-[56ch] ui:text-[17px] ui:leading-relaxed ui:text-[var(--landing-fg-muted)] {centered
            ? 'ui:mx-auto ui:text-center'
            : ''}"
        >
          {hero.subheading}
        </p>
      {/if}

      {#if children}
        <div class="ui:mt-7">{@render children()}</div>
      {/if}

      {#if showActions}
        <div class="ui:mt-8 ui:flex ui:flex-wrap ui:items-center ui:gap-2.5 {centered ? 'ui:justify-center' : ''}">
          <CoursePrimaryAction action={hero.primaryAction} size="lg" />
          {#if hero.secondaryAction}
            <SecondaryActionButton
              href={hero.secondaryAction.href}
              label={hero.secondaryAction.label}
              variant="quartz"
            />
          {/if}
        </div>
      {/if}

      {#if hero.stats && hero.stats.length > 0}
        <dl
          class="ui:mt-10 ui:pt-7 ui:m-0 ui:flex ui:flex-wrap ui:gap-x-10 ui:gap-y-5 ui:border-t ui:border-[var(--landing-border)] {centered
            ? 'ui:justify-center'
            : ''}"
        >
          {#each hero.stats as stat (stat.label)}
            <div>
              <dt
                class="ui:order-2 ui:mt-1 ui:text-xs ui:text-[var(--landing-fg-faint)] ui:[letter-spacing:var(--landing-eyebrow-tracking)] ui:[text-transform:var(--landing-eyebrow-case)]"
              >
                {stat.label}
              </dt>
              <dd
                class="ui:order-1 ui:m-0 ui:text-xl ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)] ui:[letter-spacing:var(--landing-heading-tracking)]"
              >
                {stat.value}
              </dd>
            </div>
          {/each}
        </dl>
      {/if}
    </div>

    {#if hero.image}
      <div class="ui:max-w-[1200px] ui:mx-auto ui:px-5 ui:md:px-8 ui:pb-12 ui:flex ui:justify-center">
        <figure
          class="ui:m-0 ui:w-full ui:max-w-[720px] ui:border ui:border-[var(--landing-border)] ui:bg-[var(--landing-card-soft)]"
        >
          <img src={hero.image} alt="" class="ui:block ui:w-full ui:aspect-video ui:object-cover" />
        </figure>
      </div>
    {/if}
  </header>
</EditableLandingSection>
