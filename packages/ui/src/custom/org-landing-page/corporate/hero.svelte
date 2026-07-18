<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import type { Snippet } from 'svelte';
  import SecondaryActionButton from '../secondary-action-button.svelte';
  import CoursePrimaryAction from '../course-primary-action.svelte';
  import EditableLandingSection from '../editable-section.svelte';

  interface Props {
    orgName: OrgLandingPageProps['orgName'];
    hero: OrgLandingPageProps['hero'];
    navigation: Snippet;
    showActions?: boolean;
    compact?: boolean;
    children?: Snippet;
  }

  let { orgName, hero, navigation, showActions = true, compact = false, children }: Props = $props();

  const stats = $derived(hero.stats ?? []);
</script>

{@render navigation()}

<EditableLandingSection sectionKey="hero">
  <section
    class="ui:px-6 {compact ? 'ui:pt-6 ui:pb-12 ui:md:pt-8 ui:md:pb-14' : 'ui:pt-12 ui:pb-24 ui:md:pt-16 ui:md:pb-28'}"
  >
    <div class="ui:max-w-[1120px] ui:mx-auto">
      <div class="ui:flex ui:items-center ui:gap-4 ui:pb-5 ui:mb-10 ui:border-b ui:border-[var(--landing-border)]">
        <span class="ui:text-[11px] ui:font-semibold ui:tracking-[0.2em] ui:uppercase ui:text-[var(--landing-fg)]">
          {orgName}
        </span>
        <span class="ui:h-px ui:flex-1 ui:bg-[var(--landing-border)]" aria-hidden="true"></span>
        <span
          class="ui:text-[11px] ui:font-semibold ui:tracking-[0.2em] ui:uppercase ui:text-[var(--landing-fg-muted)]"
        >
          Learning Report
        </span>
      </div>

      <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-12 ui:gap-x-8 ui:gap-y-12">
        <div class="ui:md:col-span-7">
          <h1
            class="ui:text-4xl ui:md:text-5xl ui:lg:text-[56px] ui:font-semibold ui:tracking-tight ui:leading-[1.05] ui:mb-6 ui:text-[var(--landing-fg)]"
          >
            {hero.heading}
          </h1>

          <p
            class="ui:text-base ui:md:text-lg ui:text-[var(--landing-fg-muted)] ui:max-w-xl ui:mb-8 ui:leading-relaxed"
          >
            {hero.subheading}
          </p>

          {#if children}
            <div class="ui:mt-6">{@render children()}</div>
          {/if}
          {#if showActions}
            <div class="ui:flex ui:flex-wrap ui:items-center ui:gap-3">
              <CoursePrimaryAction action={hero.primaryAction} class="ui:rounded-none ui:px-6 ui:font-medium" />
              {#if hero.secondaryAction}
                <SecondaryActionButton
                  href={hero.secondaryAction.href}
                  label={hero.secondaryAction.label}
                  variant="corporate"
                />
              {/if}
            </div>
          {/if}
        </div>

        {#if stats.length > 0}
          <aside class="ui:md:col-span-4 ui:md:col-start-9 ui:md:border-l ui:md:border-border ui:md:pl-8">
            <p
              class="ui:text-[11px] ui:font-semibold ui:tracking-[0.2em] ui:uppercase ui:text-[var(--landing-fg-muted)] ui:mb-6"
            >
              At a glance
            </p>

            <dl class="ui:flex ui:flex-col">
              {#each stats as stat, index (`${stat.label}-${index}`)}
                <div
                  class="ui:flex ui:items-baseline ui:justify-between ui:gap-4 ui:py-4 ui:border-t ui:border-[var(--landing-border)] ui:first:border-t-0"
                >
                  <div class="ui:flex ui:items-baseline ui:gap-3 ui:min-w-0">
                    <span class="ui:text-[11px] ui:font-mono ui:text-[var(--landing-fg-muted)] ui:tabular-nums">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <dt class="ui:text-sm ui:text-[var(--landing-fg)] ui:truncate">
                      {stat.label}
                    </dt>
                  </div>
                  <dd
                    class="ui:text-2xl ui:md:text-3xl ui:font-semibold ui:tracking-tight ui:tabular-nums ui:text-[var(--landing-fg)] ui:m-0"
                  >
                    {stat.value}
                  </dd>
                </div>
              {/each}
            </dl>
          </aside>
        {/if}
      </div>
    </div>
  </section>
</EditableLandingSection>
