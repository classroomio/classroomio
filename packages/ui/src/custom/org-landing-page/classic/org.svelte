<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import OrgLandingPageEmbed from '../embed.svelte';
  import OrgLandingPageLinks from '../links.svelte';
  import OrgLandingPageCallout from '../callout.svelte';
  import OrgLandingPageFooter from '../landing-page-footer.svelte';
  import ClassicNav from './nav.svelte';
  import ClassicHero from './hero.svelte';
  import ClassicCourseCard from './course-card.svelte';
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
    disableCourseLinks = false,
    embed,
    callout,
    links,
    footer,
    labels
  }: OrgLandingPageProps = $props();
</script>

<div
  class="ui:min-h-screen ui:bg-[var(--landing-bg-section)] ui:text-[var(--landing-fg)] ui:font-sans"
  style={themeStyle('classic')}
>
  <ClassicNav {orgName} {logoUrl} {navItems} {authAction} />

  <main>
    <ClassicHero {hero} />

    <section class="ui:py-10 ui:px-6 ui:lg:px-8 ui:max-w-7xl ui:mx-auto">
      <div class="ui:text-center ui:mb-8">
        <h2 class="ui:text-3xl ui:font-bold ui:text-[var(--landing-fg)]">
          {labels?.catalogHeading ?? 'Featured Courses'}
        </h2>
        <div class="ui:mt-6 ui:h-px ui:w-24 ui:bg-[var(--landing-border)] ui:mx-auto"></div>
      </div>

      {#if courses.length === 0}
        <OrgLandingPageCoursesEmpty {labels} />
      {:else}
        <div class="ui:grid ui:grid-cols-1 ui:sm:grid-cols-2 ui:lg:grid-cols-3 ui:gap-8 ui:justify-items-center">
          {#each courses as course, index (course.id)}
            <ClassicCourseCard {course} {disableCourseLinks} {labels} />
          {/each}
        </div>

        {#if hasMoreCourses}
          <div class="ui:mt-12 ui:flex ui:justify-center">
            <Button
              href={disableCourseLinks ? undefined : '/courses'}
              variant="outline"
              size="lg"
              class="ui:px-8"
              disabled={disableCourseLinks}
            >
              {labels?.browseCoursesLabel ?? 'View more courses'}
            </Button>
          </div>
        {/if}
      {/if}
    </section>
  </main>

  <OrgLandingPageLinks {links} {labels} variant="classic" />

  <OrgLandingPageEmbed {embed} {labels} variant="classic" />

  <OrgLandingPageCallout {callout} {labels} variant="classic" />

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="classic" />
</div>
