<script lang="ts">
  import type { OrgLandingPageProps } from './types';
  import OrgLandingPageEmbed from './embed.svelte';
  import OrgLandingPageLinks from './links.svelte';
  import OrgLandingPageCallout from './callout.svelte';
  import OrgLandingPageFooter from './landing-page-footer.svelte';
  import SaasNav from './saas/nav.svelte';
  import SaasHero from './saas/hero.svelte';
  import { Button } from '../../base/button';
  import { BlurFade } from '../animation/blurfade';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import TagIcon from '@lucide/svelte/icons/tag';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { getCourseTypeLandingMeta, getPrimaryCourseTag } from './landing-page-utils';

  let {
    orgName,
    logoUrl,
    navItems,
    authAction,
    hero,
    courses,
    hasMoreCourses = false,
    disableCourseLinks = false,
    embed,
    callout,
    links,
    footer
  }: OrgLandingPageProps = $props();

  function formatCurrency(cost?: number, currency = 'USD') {
    if (!cost) return 'Free';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cost);
  }
</script>

<div class="saas-root ui:min-h-screen ui:bg-background ui:text-foreground ui:font-sans">
  <div class="frame">
    <SaasHero {hero}>
      {#snippet navigation()}
        <SaasNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </SaasHero>

    {#if courses.length > 0}
      <div class="plus-row"></div>

      <section class="ui:py-20 ui:px-6">
        <div class="ui:max-w-[1180px] ui:mx-auto">
          <div class="ui:flex ui:flex-col ui:md:flex-row ui:md:items-end ui:md:justify-between ui:gap-4 ui:mb-12">
            <div>
              <p class="ui:text-xs ui:font-semibold ui:tracking-widest ui:uppercase ui:text-primary ui:mb-3">Catalog</p>
              <h2 class="ui:text-3xl ui:md:text-4xl ui:font-bold ui:tracking-tight">Featured programs.</h2>
            </div>
            {#if hasMoreCourses}
              <Button
                href={disableCourseLinks ? undefined : '/courses'}
                variant="outline"
                class="ui:rounded-full ui:self-start ui:md:self-auto"
                disabled={disableCourseLinks}
              >
                Browse catalog
              </Button>
            {/if}
          </div>

          <div class="course-grid ui:relative">
            {#each courses as course, index (course.id)}
              {@const courseTypeMeta = getCourseTypeLandingMeta(course)}
              {@const primaryTag = getPrimaryCourseTag(course)}
              <BlurFade delay={0.06 * index} once={true} class="course-card-wrap">
                <a
                  href={disableCourseLinks
                    ? undefined
                    : course.link || (course.slug ? `/course/${course.slug}` : undefined)}
                  class="course-card ui:flex ui:flex-col ui:h-full ui:no-underline ui:bg-background ui:transition-colors {disableCourseLinks
                    ? 'ui:cursor-default'
                    : 'ui:hover:bg-muted/40'}"
                  aria-disabled={disableCourseLinks}
                  tabindex={disableCourseLinks ? -1 : undefined}
                >
                  {#if course.logo}
                    <div
                      class="ui:h-40 ui:w-full ui:bg-cover ui:bg-center ui:relative"
                      style={`background-image: url(${course.logo});`}
                    >
                      {#if courseTypeMeta}
                        <span
                          class="ui:absolute ui:top-3 ui:left-3 ui:bg-background/95 ui:text-foreground ui:text-[11px] ui:font-semibold ui:px-2.5 ui:py-1 ui:rounded-full"
                        >
                          {courseTypeMeta.label}
                        </span>
                      {/if}
                    </div>
                  {/if}

                  <div class="ui:p-5 ui:flex ui:flex-col ui:flex-1 ui:gap-2">
                    <h3 class="ui:text-lg ui:font-bold ui:tracking-tight ui:leading-snug ui:m-0">
                      {course.title}
                    </h3>
                    <p class="ui:text-sm ui:text-muted-foreground ui:line-clamp-2 ui:leading-relaxed ui:m-0 ui:flex-1">
                      {course.description}
                    </p>

                    <div
                      class="ui:flex ui:items-center ui:gap-2 ui:flex-wrap ui:text-xs ui:text-muted-foreground ui:mt-2"
                    >
                      {#if course.duration}
                        <span class="ui:inline-flex ui:items-center ui:gap-1">
                          <ClockIcon class="ui:size-3.5" />
                          {course.duration}
                        </span>
                      {/if}
                      {#if primaryTag}
                        <span class="ui:inline-flex ui:items-center ui:gap-1">
                          <TagIcon class="ui:size-3.5" />
                          {#if primaryTag.color}
                            <span
                              class="ui:inline-block ui:size-2 ui:rounded-full"
                              style={`background-color: ${primaryTag.color}`}
                              aria-hidden="true"
                            ></span>
                          {/if}
                          {primaryTag.name}
                        </span>
                      {/if}
                    </div>

                    <div
                      class="ui:flex ui:items-center ui:justify-between ui:pt-4 ui:mt-2 ui:border-t ui:border-border/60"
                    >
                      <span class="ui:text-sm ui:font-bold">
                        {course.price || formatCurrency(course.cost, course.currency)}
                      </span>
                      <span
                        class="ui:inline-flex ui:items-center ui:gap-1 ui:text-xs ui:font-semibold ui:text-primary"
                        aria-hidden="true"
                      >
                        Enroll
                        <ArrowRightIcon class="ui:size-3.5" />
                      </span>
                    </div>
                  </div>
                </a>
              </BlurFade>
            {/each}
          </div>
        </div>
      </section>
    {/if}

    {#if links && links.cards.length > 0}
      <div class="plus-row"></div>
      <OrgLandingPageLinks {links} variant="saas" />
    {/if}

    {#if embed}
      <div class="plus-row"></div>
      <OrgLandingPageEmbed {embed} variant="saas" />
    {/if}

    {#if callout}
      <div class="plus-row"></div>
      <OrgLandingPageCallout {callout} variant="saas" />
    {/if}
  </div>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="saas" />
</div>

<style>
  /* ============ FRAME (vertical lines + dotted bg) ============ */
  .saas-root :global(.frame) {
    position: relative;
    max-width: 1180px;
    margin: 0 auto;
    width: 100%;
    background-image: radial-gradient(
      circle at center,
      color-mix(in oklab, var(--foreground) 5%, transparent) 1px,
      transparent 1.5px
    );
    background-size: 24px 24px;
  }
  .saas-root :global(.frame::before),
  .saas-root :global(.frame::after) {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--border);
    pointer-events: none;
    z-index: 0;
  }
  .saas-root :global(.frame::before) {
    left: 0;
  }
  .saas-root :global(.frame::after) {
    right: 0;
  }
  .saas-root :global(.frame > *) {
    position: relative;
    z-index: 1;
  }

  /* ============ PLUS-ROW (dashed divider + + markers) ============ */
  .saas-root :global(.plus-row) {
    position: relative;
    height: 0;
    border-top: 1px dashed var(--border);
    margin: 0;
  }
  .saas-root :global(.plus-row::before),
  .saas-root :global(.plus-row::after) {
    content: '+';
    position: absolute;
    top: -8px;
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 13px;
    font-weight: 400;
    color: var(--muted-foreground);
    line-height: 1;
    background: var(--background);
    padding: 1px 3px;
    z-index: 2;
  }
  .saas-root :global(.plus-row::before) {
    left: -8px;
  }
  .saas-root :global(.plus-row::after) {
    right: -8px;
  }

  /* ============ LINE-SEPARATED COURSE GRID ============ */
  .saas-root :global(.course-grid) {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
  }
  .saas-root :global(.course-grid > .course-card-wrap) {
    grid-column: span 2;
  }
  /* 1 course → centered card (drops line frame) */
  .saas-root :global(.course-grid:has(> .course-card-wrap:only-child)) {
    display: flex;
    justify-content: center;
    background: transparent;
    border: none;
    gap: 0;
  }
  .saas-root :global(.course-grid:has(> .course-card-wrap:only-child) > .course-card-wrap) {
    width: 100%;
    max-width: 520px;
  }
  .saas-root :global(.course-grid:has(> .course-card-wrap:only-child) .course-card) {
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    overflow: hidden;
  }
  /* 2 courses → halves */
  .saas-root :global(.course-grid:has(> .course-card-wrap:nth-child(2):last-child) > .course-card-wrap) {
    grid-column: span 3;
  }
  /* 4 courses → 2 × 2 halves */
  .saas-root :global(.course-grid:has(> .course-card-wrap:nth-child(4):last-child) > .course-card-wrap) {
    grid-column: span 3;
  }
  /* 6+ courses → all thirds */
  .saas-root :global(.course-grid:has(> .course-card-wrap:nth-child(6)) > .course-card-wrap) {
    grid-column: span 2;
  }
  .saas-root :global(.course-card-wrap) {
    display: flex;
  }
  .saas-root :global(.course-card-wrap > a) {
    width: 100%;
  }
</style>
