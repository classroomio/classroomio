<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import OrgLandingPageEmbed from '../embed.svelte';
  import OrgLandingPageLinks from '../links.svelte';
  import OrgLandingPageCallout from '../callout.svelte';
  import QuartzFooter from './footer.svelte';
  import OrgLandingPageCoursesEmpty from '../courses-empty.svelte';
  import LandingThemeScope from '../landing-theme-scope.svelte';
  import LandingButton from '../landing-button.svelte';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import QuartzNav from './nav.svelte';
  import QuartzHero from './hero.svelte';
  import QuartzCourseRow from './course-row.svelte';

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

<LandingThemeScope theme="quartz" class="ui:font-sans">
  <QuartzNav {orgName} {logoUrl} {navItems} {authAction} />

  <main class="ui:@container ui:max-w-[1200px] ui:mx-auto ui:border-x ui:border-[var(--landing-border)]">
    <QuartzHero {hero} />

    <section id="courses" class="ui:border-t ui:border-[var(--landing-border)]">
      <p
        class="ui:m-0 ui:px-5 ui:md:px-8 ui:py-3 ui:bg-[var(--landing-card)] ui:text-xs ui:text-[var(--landing-fg-faint)] ui:[letter-spacing:var(--landing-eyebrow-tracking)] ui:[text-transform:var(--landing-eyebrow-case)]"
      >
        {labels?.catalogEyebrow ?? 'Selected courses'}
      </p>

      {#if coursesLoaded && courses.length === 0}
        <OrgLandingPageCoursesEmpty {labels} />
      {:else}
        {#each courses as course (course.id)}
          <QuartzCourseRow {course} {disableCourseLinks} {labels} />
        {/each}

        {#if hasMoreCourses}
          <div
            class="ui:flex ui:flex-wrap ui:items-center ui:justify-between ui:gap-6 ui:px-5 ui:md:px-8 ui:py-8 ui:bg-[var(--landing-card)] ui:border-y ui:border-[var(--landing-border)]"
          >
            <div>
              <p
                class="ui:m-0 ui:text-lg ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)] ui:[letter-spacing:var(--landing-heading-tracking)]"
              >
                {labels?.catalogHeading ?? 'The full catalogue'}
              </p>
              {#if labels?.catalogDescription}
                <p class="ui:m-0 ui:mt-1.5 ui:text-sm ui:text-[var(--landing-fg-muted)]">
                  {labels.catalogDescription}
                </p>
              {/if}
            </div>
            <LandingButton
              variant="secondary"
              size="lg"
              href={disableCourseLinks ? undefined : '/courses'}
              disabled={disableCourseLinks}
            >
              {labels?.browseCoursesLabel ?? 'View more courses'}
              <ArrowRightIcon class="ui:size-3.5" aria-hidden="true" />
            </LandingButton>
          </div>
        {/if}
      {/if}
    </section>

    <OrgLandingPageLinks {links} {labels} variant="quartz" />

    <OrgLandingPageEmbed {embed} {labels} variant="quartz" />

    <OrgLandingPageCallout {callout} {labels} variant="quartz" />
  </main>

  <QuartzFooter {orgName} {logoUrl} {footer} />
</LandingThemeScope>
