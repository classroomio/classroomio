<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import OrgLandingPageEmbed from '../embed.svelte';
  import OrgLandingPageLinks from '../links.svelte';
  import OrgLandingPageCallout from '../callout.svelte';
  import OrgLandingPageFooter from '../landing-page-footer.svelte';
  import BoldNav from './nav.svelte';
  import BoldHero from './hero.svelte';
  import BoldCourseCard from './course-card.svelte';
  import OrgLandingPageCoursesEmpty from '../courses-empty.svelte';
  import { Button } from '../../../base/button';
  import { DotPattern } from '../../animation/dot-pattern';
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
  class="ui:min-h-screen ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)] ui:font-sans"
  style={themeStyle('bold')}
>
  <BoldNav {orgName} {logoUrl} {navItems} {authAction} />

  <main>
    <BoldHero {hero} />

    <section class="ui:relative ui:bg-[var(--landing-card-soft)]/30 ui:px-6 ui:overflow-hidden ui:mb-12">
      <DotPattern class="ui:opacity-[0.15]" />
      <div class="ui:relative ui:max-w-7xl ui:mx-auto">
        <div class="ui:flex ui:items-end ui:justify-between ui:mb-12">
          <h2 class="ui:text-4xl ui:font-black ui:tracking-tight">{labels?.catalogHeading ?? 'Latest Courses'}</h2>
        </div>
        {#if coursesLoaded && courses.length === 0}
          <OrgLandingPageCoursesEmpty {labels} />
        {:else}
          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:gap-8">
            {#each courses as course, index (course.id)}
              <BoldCourseCard {course} {disableCourseLinks} {labels} />
            {/each}
          </div>

          {#if hasMoreCourses}
            <div class="ui:mt-12 ui:flex ui:justify-center">
              <Button
                href={disableCourseLinks ? undefined : '/courses'}
                size="lg"
                class="ui:rounded-xl ui:px-8"
                disabled={disableCourseLinks}
              >
                {labels?.browseCoursesLabel ?? 'View more courses'}
              </Button>
            </div>
          {/if}
        {/if}
      </div>
    </section>
  </main>

  <OrgLandingPageLinks {links} {labels} variant="bold" />

  <OrgLandingPageEmbed {embed} {labels} variant="bold" />

  <OrgLandingPageCallout {callout} {labels} variant="bold" />

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="bold" />
</div>
