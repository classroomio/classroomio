<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import OrgLandingPageEmbed from '../embed.svelte';
  import OrgLandingPageLinks from '../links.svelte';
  import OrgLandingPageCallout from '../callout.svelte';
  import OrgLandingPageFooter from '../landing-page-footer.svelte';
  import CorporateNav from './nav.svelte';
  import CorporateHero from './hero.svelte';
  import CorporateCourseCard from './course-card.svelte';
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
    disableCourseLinks = false,
    embed,
    callout,
    links,
    footer,
    labels
  }: OrgLandingPageProps = $props();
</script>

<div
  class="ui:min-h-screen ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)] ui:font-sans"
  style={themeStyle('corporate')}
>
  <main>
    <CorporateHero {orgName} {hero}>
      {#snippet navigation()}
        <CorporateNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </CorporateHero>

    {#if courses.length > 0}
      <section class="ui:py-24 ui:px-6 ui:border-t ui:border-[var(--landing-border)]">
        <div class="ui:max-w-[1120px] ui:mx-auto">
          <div class="ui:flex ui:items-end ui:justify-between ui:flex-wrap ui:gap-4 ui:mb-10">
            <div>
              <p
                class="ui:text-xs ui:font-semibold ui:tracking-widest ui:uppercase ui:text-[var(--landing-fg)] ui:mb-3"
              >
                {labels?.catalogEyebrow ?? 'Catalog'}
              </p>
              <h2 class="ui:text-3xl ui:lg:text-4xl ui:font-semibold ui:tracking-tight ui:m-0 ui:max-w-xl">
                {labels?.catalogHeading ?? 'Programs your teams are taking'}
              </h2>
            </div>
            {#if hasMoreCourses}
              <Button
                href={disableCourseLinks ? undefined : '/courses'}
                variant="outline"
                class="ui:rounded-none ui:font-medium"
                disabled={disableCourseLinks}
              >
                {labels?.browseCoursesLabel ?? 'Browse catalog →'}
              </Button>
            {/if}
          </div>

          <div
            class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:border-t ui:border-l ui:border-[var(--landing-border)]"
          >
            {#each courses as course, index (course.id)}
              <CorporateCourseCard {course} {disableCourseLinks} {labels} />
            {/each}
          </div>
        </div>
      </section>
    {/if}
  </main>

  <OrgLandingPageLinks {links} {labels} variant="corporate" />

  <OrgLandingPageEmbed {embed} {labels} variant="corporate" />

  <OrgLandingPageCallout {callout} {labels} variant="corporate" />

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="corporate" />
</div>
