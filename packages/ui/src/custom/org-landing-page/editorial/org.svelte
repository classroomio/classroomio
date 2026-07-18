<script lang="ts">
  import type { OrgLandingPageProps, CourseItem } from '../types';
  import OrgLandingPageEmbed from '../embed.svelte';
  import OrgLandingPageLinks from '../links.svelte';
  import OrgLandingPageCallout from '../callout.svelte';
  import OrgLandingPageFooter from '../landing-page-footer.svelte';
  import EditorialNav from './nav.svelte';
  import EditorialHero from './hero.svelte';
  import EditorialCourseCard from './course-card.svelte';
  import OrgLandingPageCoursesEmpty from '../courses-empty.svelte';
  import { themeStyle } from '../theme-style';
  import { Button } from '../../../base/button';
  import { getCourseTypeLandingMeta } from '../landing-page-utils';

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

  function formatCost(cost?: number, currency = 'USD'): string {
    if (!cost) return labels?.freeLabel ?? 'Free';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cost);
  }

  type FilterKey = 'ALL' | 'LIVE_CLASS' | 'SELF_PACED' | 'COMPLIANCE' | 'PUBLIC';

  const filterDefs: Array<{ key: FilterKey; label: string }> = $derived([
    { key: 'ALL', label: labels?.filterAllLabel ?? 'All' },
    {
      key: 'LIVE_CLASS',
      label: getCourseTypeLandingMeta({ id: '', title: '', description: '', type: 'LIVE_CLASS' })?.label ?? 'Live class'
    },
    {
      key: 'SELF_PACED',
      label: getCourseTypeLandingMeta({ id: '', title: '', description: '', type: 'SELF_PACED' })?.label ?? 'Self-paced'
    },
    {
      key: 'COMPLIANCE',
      label: getCourseTypeLandingMeta({ id: '', title: '', description: '', type: 'COMPLIANCE' })?.label ?? 'Compliance'
    },
    {
      key: 'PUBLIC',
      label: getCourseTypeLandingMeta({ id: '', title: '', description: '', type: 'PUBLIC' })?.label ?? 'Public'
    }
  ]);

  let activeFilter: FilterKey = $state('ALL');

  const filterCounts = $derived.by(() => {
    const counts: Record<FilterKey, number> = {
      ALL: courses.length,
      LIVE_CLASS: 0,
      SELF_PACED: 0,
      COMPLIANCE: 0,
      PUBLIC: 0
    };
    for (const course of courses) {
      const t = course.type?.trim().toUpperCase();
      if (t === 'LIVE_CLASS' || t === 'SELF_PACED' || t === 'COMPLIANCE' || t === 'PUBLIC') {
        counts[t]++;
      }
    }
    return counts;
  });

  const visibleFilterDefs = $derived(filterDefs.filter((f) => f.key === 'ALL' || filterCounts[f.key] > 0));

  const filteredCourses = $derived(
    activeFilter === 'ALL' ? courses : courses.filter((c) => c.type?.trim().toUpperCase() === activeFilter)
  );

  function courseHref(course: CourseItem): string | undefined {
    if (disableCourseLinks) return undefined;
    return course.link || (course.slug ? `/course/${course.slug}` : undefined);
  }
</script>

<div
  class="ui:min-h-screen ui:font-sans ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)]"
  style={themeStyle('editorial')}
>
  <main>
    <EditorialHero {hero} {courses} {labels}>
      {#snippet navigation()}
        <EditorialNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </EditorialHero>

    <section id="courses" class="ui:py-10 ui:px-6 ui:md:px-8 ui:bg-[var(--landing-bg)]">
      <div class="ui:max-w-[1240px] ui:mx-auto">
        <div class="ui:flex ui:flex-col ui:md:flex-row ui:md:items-end ui:justify-between ui:gap-6 ui:mb-8">
          <div>
            <p class="ui:text-[13px] ui:m-0 ui:mb-2 ui:text-[var(--landing-fg-muted)]">
              {labels?.catalogEyebrow ?? 'Catalog'}
            </p>
            <h2
              class="ui:text-3xl ui:md:text-[40px] ui:font-medium ui:tracking-tight ui:m-0 ui:leading-[1.1] ui:text-[var(--landing-fg)]"
              style="letter-spacing: -0.025em;"
            >
              {labels?.catalogHeading ?? 'Courses starting this season.'}
            </h2>
            <p class="ui:text-base ui:mt-3 ui:max-w-xl ui:m-0 ui:text-[var(--landing-fg-muted)]">
              {labels?.catalogDescription ??
                'Cohort-based and self-paced — every course ends with a reviewed project and a certificate of completion.'}
            </p>
          </div>
          {#if hasMoreCourses && courses.length > 0}
            <Button
              href={disableCourseLinks ? undefined : '/courses'}
              variant="outline"
              class="ui:rounded-full ui:px-5 ui:font-medium ui:bg-transparent ui:border-[var(--landing-border)] ui:text-[var(--landing-fg)] ui:hover:bg-[var(--landing-bg-section)]"
              disabled={disableCourseLinks}
            >
              {labels?.browseCoursesLabel ?? 'Browse all courses →'}
            </Button>
          {/if}
        </div>

        {#if coursesLoaded && courses.length === 0}
          <OrgLandingPageCoursesEmpty {labels} />
        {:else}
          {#if visibleFilterDefs.length > 1}
            <div class="ui:flex ui:flex-wrap ui:items-center ui:gap-1.5 ui:mb-8">
              {#each visibleFilterDefs as def (def.key)}
                {@const isActive = activeFilter === def.key}
                <button
                  type="button"
                  class="ui:inline-flex ui:items-center ui:gap-1.5 ui:px-3.5 ui:py-1.5 ui:rounded-full ui:text-[13.5px] ui:transition-colors ui:border ui:cursor-pointer"
                  style={isActive
                    ? 'background: var(--landing-fg); color: var(--landing-bg); border-color: var(--landing-fg);'
                    : 'background: transparent; color: var(--landing-fg); border-color: var(--landing-border);'}
                  onclick={() => (activeFilter = def.key)}
                >
                  {def.label}
                  <span
                    class="ui:text-[11.5px] ui:tabular-nums"
                    style={isActive ? 'opacity: 0.6;' : 'color: var(--landing-fg-faint);'}
                  >
                    {filterCounts[def.key]}
                  </span>
                </button>
              {/each}
            </div>
          {/if}

          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-4">
            {#each filteredCourses as course, index (course.id)}
              <EditorialCourseCard {course} {index} {disableCourseLinks} {labels} />
            {/each}
          </div>

          {#if hasMoreCourses}
            <div class="ui:text-center ui:mt-10">
              <Button
                href={disableCourseLinks ? undefined : '/courses'}
                size="lg"
                class="ui:rounded-full ui:px-6 ui:font-medium ui:bg-[var(--landing-fg)] ui:text-[var(--landing-bg)] ui:hover:opacity-90"
                disabled={disableCourseLinks}
              >
                {labels?.browseCoursesLabel ?? 'View all courses'}
              </Button>
            </div>
          {/if}
        {/if}
      </div>
    </section>
  </main>

  <OrgLandingPageLinks {links} {labels} variant="editorial" />

  <OrgLandingPageEmbed {embed} {labels} variant="editorial" />

  <OrgLandingPageCallout {callout} {labels} variant="editorial" />

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="editorial" />
</div>
