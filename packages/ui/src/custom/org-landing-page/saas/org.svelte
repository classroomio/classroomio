<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import OrgLandingPageEmbed from '../embed.svelte';
  import OrgLandingPageLinks from '../links.svelte';
  import OrgLandingPageCallout from '../callout.svelte';
  import OrgLandingPageFooter from '../landing-page-footer.svelte';
  import SaasNav from './nav.svelte';
  import SaasHero from './hero.svelte';
  import SaasCourseCard from './course-card.svelte';
  import OrgLandingPageCoursesEmpty from '../courses-empty.svelte';
  import { Button } from '../../../base/button';
  import { themeStyle } from '../theme-style';

  let {
    orgName,
    logoUrl,
    navItems,
    authAction,
    hero,
    courses,
    hasMoreCourses = false,
    coursesLoaded = true,
    disableCourseLinks = false,
    embed,
    callout,
    links,
    footer,
    labels
  }: OrgLandingPageProps = $props();
</script>

<div
  class="saas-root ui:min-h-screen ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)] ui:font-sans"
  style={themeStyle('saas')}
>
  <div class="frame">
    <SaasHero {hero}>
      {#snippet navigation()}
        <SaasNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </SaasHero>

    <div class="plus-row"></div>

    <section class="ui:py-12 ui:md:py-20 ui:px-4 ui:md:px-6">
      <div class="ui:max-w-[1180px] ui:mx-auto">
        <div
          class="ui:flex ui:flex-col ui:md:flex-row ui:md:items-end ui:md:justify-between ui:gap-4 ui:mb-8 ui:md:mb-12"
        >
          <div>
            <p
              class="ui:text-xs ui:font-semibold ui:tracking-widest ui:uppercase ui:text-[var(--landing-accent)] ui:mb-3"
            >
              {labels?.catalogEyebrow ?? 'Catalog'}
            </p>
            <h2 class="ui:text-3xl ui:md:text-4xl ui:font-bold ui:tracking-tight">
              {labels?.catalogHeading ?? 'Featured courses.'}
            </h2>
          </div>
          {#if hasMoreCourses && courses.length > 0}
            <Button
              href={disableCourseLinks ? undefined : '/courses'}
              variant="outline"
              class="ui:rounded-full ui:self-start ui:md:self-auto"
              disabled={disableCourseLinks}
            >
              {labels?.browseCoursesLabel ?? 'Browse catalog'}
            </Button>
          {/if}
        </div>

        {#if coursesLoaded && courses.length === 0}
          <OrgLandingPageCoursesEmpty {labels} />
        {:else}
          <div class="course-grid ui:relative">
            {#each courses as course, index (course.id)}
              <SaasCourseCard {course} {disableCourseLinks} {labels} />
            {/each}
          </div>
        {/if}
      </div>
    </section>

    {#if links && links.cards.length > 0}
      <div class="plus-row"></div>
      <OrgLandingPageLinks {links} {labels} variant="saas" />
    {/if}

    {#if embed}
      <div class="plus-row"></div>
      <OrgLandingPageEmbed {embed} {labels} variant="saas" />
    {/if}

    {#if callout}
      <div class="plus-row"></div>
      <OrgLandingPageCallout {callout} {labels} variant="saas" />
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
      color-mix(in oklab, var(--landing-fg) 5%, transparent) 1px,
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
    background: var(--landing-border);
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
    border-top: 1px dashed var(--landing-border);
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
    color: var(--landing-fg-muted);
    line-height: 1;
    background: var(--landing-bg);
    padding: 1px 3px;
    z-index: 2;
  }
  .saas-root :global(.plus-row::before) {
    left: -8px;
  }
  .saas-root :global(.plus-row::after) {
    right: -8px;
  }

  /* ============ LINE-SEPARATED COURSE GRID (mobile-first) ============ */
  .saas-root :global(.course-grid) {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1px;
    border: 1px solid var(--landing-border);
  }
  @media (min-width: 640px) {
    .saas-root :global(.course-grid) {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (min-width: 1024px) {
    .saas-root :global(.course-grid) {
      grid-template-columns: repeat(3, 1fr);
    }
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
    border: 1px solid var(--landing-border);
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
