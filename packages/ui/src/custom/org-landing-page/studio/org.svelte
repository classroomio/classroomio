<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import OrgLandingPageEmbed from '../embed.svelte';
  import OrgLandingPageLinks from '../links.svelte';
  import OrgLandingPageCallout from '../callout.svelte';
  import OrgLandingPageFooter from '../landing-page-footer.svelte';
  import StudioNav from './nav.svelte';
  import StudioHero from './hero.svelte';
  import StudioCourseCard from './course-card.svelte';
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
  style={themeStyle('studio')}
>
  <main>
    <StudioHero {hero} {courses}>
      {#snippet navigation()}
        <StudioNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </StudioHero>

    {#if courses.length > 0}
      <section class="ui:py-24 ui:px-6 ui:border-t ui:border-[var(--landing-border)]">
        <div class="ui:max-w-[1080px] ui:mx-auto">
          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:gap-12 ui:items-end ui:mb-12">
            <div>
              <p class="ui:text-sm ui:text-[var(--landing-fg-muted)] ui:mb-1.5 ui:inline-flex ui:items-center ui:gap-2">
                <span class="ui:size-1.5 ui:rounded-full ui:bg-[var(--landing-accent)]"></span>
                {labels?.catalogEyebrow ?? 'Catalog'}
              </p>
              <h2 class="ui:text-3xl ui:lg:text-4xl ui:font-semibold ui:tracking-tight ui:m-0">
                {labels?.catalogHeading ?? 'Programs your team can actually finish.'}
              </h2>
            </div>
            {#if hasMoreCourses}
              <div class="ui:flex ui:justify-start ui:md:justify-end">
                <Button
                  href={disableCourseLinks ? undefined : '/courses'}
                  variant="outline"
                  class="ui:rounded-md"
                  disabled={disableCourseLinks}
                >
                  {labels?.browseCoursesLabel ?? 'Browse all →'}
                </Button>
              </div>
            {/if}
          </div>

          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-3">
            {#each courses as course, index (course.id)}
              <StudioCourseCard {course} {disableCourseLinks} {labels} />
            {/each}
          </div>
        </div>
      </section>
    {/if}
  </main>

  <OrgLandingPageLinks {links} {labels} variant="studio" />

  <OrgLandingPageEmbed {embed} {labels} variant="studio" />

  <OrgLandingPageCallout {callout} {labels} variant="studio" />

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="studio" />
</div>
