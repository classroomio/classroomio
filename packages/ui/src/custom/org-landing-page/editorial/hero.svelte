<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import type { Snippet } from 'svelte';
  import SecondaryActionButton from '../secondary-action-button.svelte';
  import { Button } from '../../../base/button';
  import EditableLandingSection from '../editable-section.svelte';
  import { getCourseTypeLandingMeta } from '../landing-page-utils';

  interface Props {
    hero: OrgLandingPageProps['hero'];
    courses: OrgLandingPageProps['courses'];
    labels?: OrgLandingPageProps['labels'];
    navigation: Snippet;
    showActions?: boolean;
    compact?: boolean;
    children?: Snippet;
  }

  let { hero, courses = [], labels, navigation, showActions = true, compact = false, children }: Props = $props();

  const featured = $derived(courses[0]);
  const featuredTypeMeta = $derived(featured ? getCourseTypeLandingMeta(featured) : undefined);
  const syllabusItems = $derived(
    featured
      ? [
          { label: 'Foundations', duration: '42 min' },
          { label: 'Core concepts', duration: '1h 12m' },
          { label: 'Hands-on practice', duration: '58 min' },
          { label: 'Capstone project', duration: '2h 30m' }
        ]
      : []
  );

  function formatCost(cost?: number, currency = 'USD'): string {
    if (!cost) return labels?.freeLabel ?? 'Free';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cost);
  }
</script>

{@render navigation()}

<EditableLandingSection sectionKey="hero">
  <section
    class="ui:px-6 ui:md:px-8 {compact
      ? 'ui:pt-8 ui:md:pt-10 ui:pb-6'
      : 'ui:pt-16 ui:md:pt-20 ui:pb-12'} ui:bg-[var(--landing-bg)]"
  >
    <div class="ui:max-w-[1240px] ui:mx-auto">
      <div
        class="ui:grid ui:grid-cols-1 ui:gap-12 ui:lg:gap-14 ui:items-start {featured
          ? 'ui:lg:grid-cols-[1fr_1.05fr]'
          : ''}"
      >
        <div class={featured ? '' : 'ui:text-center'}>
          {#if hero.stats && hero.stats.length > 0}
            <p class="ui:text-[13px] ui:mb-5 ui:text-[var(--landing-fg-muted)]">
              {hero.stats[0].label}
              {#if hero.stats[0].value}
                <span class="ui:mx-2" aria-hidden="true">·</span>
                <span class="ui:text-[var(--landing-fg)]">{hero.stats[0].value}</span>
              {/if}
            </p>
          {/if}

          <h1
            class="ui:text-[44px] ui:md:text-[56px] ui:lg:text-[64px] ui:font-medium ui:tracking-tight ui:leading-[1.02] ui:m-0 ui:mb-5 ui:text-[var(--landing-fg)]"
            style="letter-spacing: -0.03em;"
          >
            {hero.heading}
          </h1>

          <p
            class="ui:text-lg ui:md:text-xl ui:leading-[1.35] ui:max-w-xl ui:m-0 ui:mb-9 ui:text-[var(--landing-fg-muted)] {featured
              ? ''
              : 'ui:mx-auto'}"
            style="letter-spacing: -0.012em;"
          >
            {hero.subheading}
          </p>

          {#if children}
            <div class="ui:mt-6 {featured ? '' : 'ui:flex ui:justify-center'}">{@render children()}</div>
          {/if}
          {#if showActions}
            <div class="ui:flex ui:flex-wrap ui:items-center ui:gap-2.5 {featured ? '' : 'ui:justify-center'}">
              <Button
                href={hero.primaryAction.href}
                disabled={hero.primaryAction.disabled ?? false}
                size="lg"
                class="ui:rounded-full ui:px-6 ui:font-medium ui:bg-[var(--landing-fg)] ui:text-[var(--landing-bg)] ui:hover:opacity-90"
              >
                {hero.primaryAction.label}
              </Button>
              {#if hero.secondaryAction}
                <SecondaryActionButton
                  href={hero.secondaryAction.href}
                  label={hero.secondaryAction.label}
                  variant="editorial"
                />
              {/if}
            </div>
          {/if}
        </div>

        {#if featured}
          {@const cost = featured.cost ?? 0}
          {@const seats = featured.totalStudents ?? 0}
          <div
            class="ui:relative ui:overflow-hidden ui:rounded-xl"
            style="
              height: 480px;
              background:
                radial-gradient(60% 80% at 20% 30%, #b8a877 0%, transparent 60%),
                radial-gradient(50% 60% at 80% 70%, #6b7a4a 0%, transparent 65%),
                radial-gradient(40% 50% at 50% 50%, #d4c89a 0%, transparent 70%),
                linear-gradient(135deg, #8a9460 0%, #c4a878 50%, #8b7a4f 100%);
            "
          >
            <div
              class="ui:pointer-events-none ui:absolute ui:inset-0"
              style="
                background-image:
                  repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 4px),
                  repeating-linear-gradient(-45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 6px);
                mix-blend-mode: overlay;
              "
              aria-hidden="true"
            ></div>

            <div
              class="ui:absolute ui:left-1/2 ui:top-1/2 ui:-translate-x-1/2 ui:-translate-y-1/2 ui:w-[84%] ui:overflow-hidden ui:rounded-[10px] ui:bg-[var(--landing-card)]"
              style="
                border: 1px solid var(--landing-border);
                box-shadow: 0 24px 60px -20px rgba(0,0,0,0.28);
              "
            >
              <div class="ui:flex ui:items-center ui:gap-2 ui:px-5 ui:pt-4 ui:text-[var(--landing-fg-muted)]">
                <span
                  class="ui:inline-flex ui:items-center ui:gap-1.5 ui:rounded-full ui:px-2.5 ui:py-0.5 ui:text-[11.5px] ui:font-medium ui:bg-[var(--landing-bg-section)] ui:text-[var(--landing-fg)]"
                >
                  {featuredTypeMeta?.label ?? labels?.featuredLabel ?? 'Featured'}
                </span>
                {#if featured.duration}
                  <span class="ui:text-[12px]" aria-hidden="true">·</span>
                  <span class="ui:text-[12px]">{featured.duration}</span>
                {/if}
              </div>
              <h3
                class="ui:m-0 ui:mx-5 ui:mt-2 ui:mb-2 ui:text-[22px] ui:font-medium ui:tracking-tight ui:text-[var(--landing-fg)]"
                style="letter-spacing: -0.02em;"
              >
                {featured.title}
              </h3>
              <p
                class="ui:m-0 ui:mx-5 ui:mb-4 ui:text-[13px] ui:line-clamp-2 ui:text-[var(--landing-fg-muted)]"
                style="line-height: 1.5;"
              >
                {featured.description}
              </p>

              <div class="ui:px-5 ui:pb-4">
                {#each syllabusItems as item, idx (idx)}
                  <div
                    class="ui:flex ui:items-center ui:gap-2.5 ui:py-1.5 ui:text-[13px]"
                    style={idx === 0 ? '' : 'border-top: 1px solid var(--landing-border-soft);'}
                  >
                    <span class="ui:text-[11px] ui:w-4 ui:tabular-nums ui:text-[var(--landing-fg-faint)]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span class="ui:flex-1 ui:text-[var(--landing-fg)]">{item.label}</span>
                    <span class="ui:text-[11.5px] ui:tabular-nums ui:text-[var(--landing-fg-muted)]"
                      >{item.duration}</span
                    >
                  </div>
                {/each}
              </div>

              <div
                class="ui:flex ui:items-center ui:justify-between ui:px-5 ui:py-3 ui:bg-[var(--landing-bg)]"
                style="border-top: 1px solid var(--landing-border-soft);"
              >
                <span class="ui:text-sm ui:font-semibold ui:text-[var(--landing-fg)]" style="letter-spacing: -0.01em;">
                  {formatCost(cost, featured.currency)}
                </span>
                {#if seats > 0}
                  <span class="ui:text-[12.5px] ui:text-[var(--landing-fg-muted)]"
                    >{(labels?.enrolledLabel ?? ((n: number) => `${n.toLocaleString()} enrolled`))(seats)}</span
                  >
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </section>
</EditableLandingSection>
