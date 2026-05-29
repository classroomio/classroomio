<script lang="ts">
  import type { OrgLandingPageProps, CourseItem } from './types';
  import OrgLandingPageEmbed from './embed.svelte';
  import OrgLandingPageLinks from './links.svelte';
  import OrgLandingPageCallout from './callout.svelte';
  import OrgLandingPageFooter from './landing-page-footer.svelte';
  import TerminalNav from './terminal/nav.svelte';
  import TerminalHero from './terminal/hero.svelte';
  import TerminalCourseCard from './terminal/course-card.svelte';
  import { Button } from '../../base/button';
  import { themeStyle } from './theme-style';
  import { getCourseTypeLandingMeta } from './landing-page-utils';

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

  function priceLabel(course: CourseItem): string {
    if (course.price) return course.price;
    if (!course.cost) return labels?.freeLabel ?? 'Free';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: course.currency ?? 'USD',
      maximumFractionDigits: 0
    }).format(course.cost);
  }

  type TabKey = 'all' | string;

  const courseTypeKeys = $derived(
    Array.from(new Set(courses.map((course) => course.type).filter((t): t is string => Boolean(t))))
  );

  const tabs = $derived<{ key: TabKey; label: string }[]>([
    { key: 'all', label: labels?.filterAllLabel ?? 'All' },
    ...courseTypeKeys.map((type) => {
      const meta = getCourseTypeLandingMeta({ id: '', title: '', description: '', type } as CourseItem);

      return { key: type, label: meta?.label ?? type };
    })
  ]);

  let activeTab = $state<TabKey>('all');

  const visibleCourses = $derived(
    activeTab === 'all' ? courses : courses.filter((course) => course.type === activeTab)
  );

  function slugify(course: CourseItem): string {
    if (course.slug) return course.slug;

    return course.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
</script>

<div
  class="ui:min-h-screen ui:font-sans ui:w-full ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)]"
  style={themeStyle('terminal')}
>
  <main>
    <TerminalHero {orgName} {hero} {courses}>
      {#snippet navigation()}
        <TerminalNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </TerminalHero>

    {#if courses.length > 0}
      <section
        class="ui:py-24 ui:px-6 ui:bg-[var(--landing-bg)]"
        style="border-top: 1px solid var(--landing-border-soft);"
      >
        <div class="ui:max-w-[1120px] ui:mx-auto">
          <p
            class="ui:font-mono ui:text-[11px] ui:tracking-[0.12em] ui:uppercase ui:mb-3 ui:inline-flex ui:items-center ui:gap-2"
            style="color: var(--landing-accent);"
          >
            <span
              class="ui:size-1.5 ui:rounded-full"
              style="background: var(--landing-accent); box-shadow: 0 0 12px var(--landing-accent);"
            ></span>
            {labels?.catalogEyebrow ?? 'Catalog'}
          </p>

          <h2
            class="ui:text-4xl ui:lg:text-[40px] ui:font-semibold ui:tracking-tight ui:leading-[1.08] ui:m-0 ui:mb-3 ui:max-w-[700px] ui:text-[var(--landing-fg)]"
          >
            {labels?.catalogHeading ?? 'Programs your team can actually finish.'}
          </h2>

          <p class="ui:text-[15px] ui:max-w-xl ui:m-0 ui:mb-8 ui:text-[var(--landing-fg-muted)]">
            {labels?.catalogDescription ??
              'Tracks built around real-world artifacts — pull requests, postmortems, and runbooks. No filler.'}
          </p>

          {#if tabs.length > 1}
            <div
              class="ui:inline-flex ui:items-center ui:gap-0.5 ui:p-1 ui:rounded-full ui:mb-8 ui:bg-[var(--landing-card)]"
              style="border: 1px solid var(--landing-border);"
              role="tablist"
            >
              {#each tabs as tab (tab.key)}
                {@const isActive = activeTab === tab.key}
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onclick={() => (activeTab = tab.key)}
                  class="ui:px-3.5 ui:py-1.5 ui:text-[13px] ui:font-medium ui:rounded-full ui:transition-colors ui:cursor-pointer"
                  style={isActive
                    ? 'background: var(--landing-fg); color: var(--landing-bg);'
                    : 'background: transparent; color: var(--landing-fg-muted);'}
                >
                  {tab.label}
                </button>
              {/each}
            </div>
          {/if}

          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-[14px]">
            {#each visibleCourses as course, index (course.id)}
              <TerminalCourseCard {course} {disableCourseLinks} {labels} />
            {/each}
          </div>

          {#if hasMoreCourses}
            <div class="ui:mt-7 ui:flex ui:justify-center">
              <Button
                href={disableCourseLinks ? undefined : '/courses'}
                variant="outline"
                disabled={disableCourseLinks}
                class="ui:rounded-full ui:px-5 ui:bg-transparent ui:border-[var(--landing-border)] ui:text-[var(--landing-fg)] ui:hover:bg-white/5"
              >
                {labels?.browseCoursesLabel ?? 'View all programs →'}
              </Button>
            </div>
          {/if}
        </div>
      </section>
    {/if}
  </main>

  <OrgLandingPageLinks {links} {labels} variant="terminal" />

  <OrgLandingPageEmbed {embed} {labels} variant="terminal" />

  <OrgLandingPageCallout {callout} {labels} variant="terminal" />

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="terminal" />
</div>
