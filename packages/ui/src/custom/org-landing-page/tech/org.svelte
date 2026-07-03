<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import OrgLandingPageEmbed from '../embed.svelte';
  import OrgLandingPageLinks from '../links.svelte';
  import OrgLandingPageCallout from '../callout.svelte';
  import OrgLandingPageFooter from '../landing-page-footer.svelte';
  import TechNav from './nav.svelte';
  import TechHero from './hero.svelte';
  import TechCourseCard from './course-card.svelte';
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
  class="ui:min-h-screen ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)] ui:font-sans"
  style={themeStyle('tech')}
>
  <main>
    <TechHero {hero}>
      {#snippet navigation()}
        <TechNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </TechHero>

    <section class="ui:py-24 ui:px-6">
      <div class="ui:max-w-[1280px] ui:mx-auto">
        <div class="ui:flex ui:items-end ui:justify-between ui:flex-wrap ui:gap-4 ui:mb-14">
          <div>
            <p class="ui:font-mono ui:text-xs ui:tracking-widest ui:uppercase ui:text-[var(--landing-accent)] ui:mb-3">
              {labels?.catalogEyebrow ?? '// catalog'}
            </p>
            <h2 class="ui:text-4xl ui:lg:text-5xl ui:font-extrabold ui:tracking-tight ui:m-0">
              {labels?.catalogHeading ?? 'Latest courses'}
            </h2>
          </div>
          {#if hasMoreCourses && courses.length > 0}
            <Button
              href={disableCourseLinks ? undefined : '/courses'}
              variant="outline"
              class="ui:rounded-none ui:font-mono ui:text-sm"
              disabled={disableCourseLinks}
            >
              {labels?.browseCoursesLabel ?? 'view all →'}
            </Button>
          {/if}
        </div>

        {#if coursesLoaded && courses.length === 0}
          <OrgLandingPageCoursesEmpty {labels} />
        {:else}
          <div
            class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:border-t ui:border-l ui:border-[var(--landing-border)]"
          >
            {#each courses as course, index (course.id)}
              <TechCourseCard {course} {disableCourseLinks} {labels} />
            {/each}
          </div>
        {/if}
      </div>
    </section>
  </main>

  <OrgLandingPageLinks {links} {labels} variant="tech" />

  <OrgLandingPageEmbed {embed} {labels} variant="tech" />

  <OrgLandingPageCallout {callout} {labels} variant="tech" />

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="tech" />
</div>
