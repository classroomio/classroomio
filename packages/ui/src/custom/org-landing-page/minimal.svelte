<script lang="ts">
  import type { OrgLandingPageProps } from './types';
  import OrgLandingPageEmbed from './embed.svelte';
  import OrgLandingPageLinks from './links.svelte';
  import OrgLandingPageCallout from './callout.svelte';
  import OrgLandingPageFooter from './landing-page-footer.svelte';
  import MinimalNav from './minimal/nav.svelte';
  import MinimalHero from './minimal/hero.svelte';
  import MinimalCourseCard from './minimal/course-card.svelte';
  import { Button } from '../../base/button';
  import { themeStyle } from './theme-style';

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
  style={themeStyle('minimal')}
>
  <main>
    <MinimalHero {hero}>
      {#snippet navigation()}
        <MinimalNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </MinimalHero>

    <section class="ui:py-20 ui:px-4">
      <div class="ui:max-w-[1200px] ui:mx-auto">
        <h2 class="ui:text-2xl ui:font-semibold ui:mb-8">{labels?.catalogHeading ?? 'Our Courses'}</h2>
        <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:gap-6">
          {#each courses as course, index (course.id)}
            <MinimalCourseCard {course} {disableCourseLinks} {labels} />
          {/each}
        </div>

        {#if hasMoreCourses}
          <div class="ui:mt-10 ui:flex ui:justify-center">
            <Button
              href={disableCourseLinks ? undefined : '/courses'}
              variant="outline"
              size="lg"
              disabled={disableCourseLinks}
            >
              {labels?.browseCoursesLabel ?? 'View more courses'}
            </Button>
          </div>
        {/if}
      </div>
    </section>
  </main>

  <OrgLandingPageLinks {links} {labels} variant="minimal" />

  <OrgLandingPageEmbed {embed} {labels} variant="minimal" />

  <OrgLandingPageCallout {callout} {labels} variant="minimal" />

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="minimal" />
</div>
