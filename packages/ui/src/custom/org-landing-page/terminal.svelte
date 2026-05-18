<script lang="ts">
  import type { OrgLandingPageProps, CourseItem } from './types';
  import OrgLandingPageEmbed from './embed.svelte';
  import OrgLandingPageLinks from './links.svelte';
  import OrgLandingPageCallout from './callout.svelte';
  import OrgLandingPageFooter from './landing-page-footer.svelte';
  import TerminalNav from './terminal/nav.svelte';
  import TerminalHero from './terminal/hero.svelte';
  import { Button } from '../../base/button';
  import { BlurFade } from '../animation/blurfade';
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
    footer
  }: OrgLandingPageProps = $props();

  function priceLabel(course: CourseItem): string {
    if (course.price) return course.price;
    if (!course.cost) return 'Free';

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
    { key: 'all', label: 'All' },
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
  class="ui:min-h-screen ui:font-sans ui:w-full"
  style="
    background: #06070a;
    color: #e9eaed;
    --terminal-bg: #06070a;
    --terminal-bg-soft: #0c0e13;
    --terminal-bg-card: #0f1218;
    --terminal-bg-elevated: #14171f;
    --terminal-line: #1c1f28;
    --terminal-line-soft: #161922;
    --terminal-line-strong: #262a35;
    --terminal-ink: #e9eaed;
    --terminal-ink-dim: #9da1ab;
    --terminal-ink-muted: #61656f;
    --terminal-ink-faint: #3d4049;
  "
>
  <main>
    <TerminalHero {orgName} {hero} {courses}>
      {#snippet navigation()}
        <TerminalNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </TerminalHero>

    {#if courses.length > 0}
      <section
        class="ui:py-24 ui:px-6"
        style="border-top: 1px solid var(--terminal-line); background: var(--terminal-bg);"
      >
        <div class="ui:max-w-[1120px] ui:mx-auto">
          <BlurFade delay={0} once={true}>
            <p
              class="ui:font-mono ui:text-[11px] ui:tracking-[0.12em] ui:uppercase ui:mb-3 ui:inline-flex ui:items-center ui:gap-2"
              style="color: var(--primary);"
            >
              <span
                class="ui:size-1.5 ui:rounded-full"
                style="background: var(--primary); box-shadow: 0 0 12px var(--primary);"
              ></span>
              Catalog
            </p>
          </BlurFade>

          <BlurFade delay={0.08} once={true}>
            <h2
              class="ui:text-4xl ui:lg:text-[40px] ui:font-semibold ui:tracking-tight ui:leading-[1.08] ui:m-0 ui:mb-3 ui:max-w-[700px]"
              style="color: var(--terminal-ink);"
            >
              Programs your team can actually finish.
            </h2>
          </BlurFade>

          <BlurFade delay={0.14} once={true}>
            <p class="ui:text-[15px] ui:max-w-xl ui:m-0 ui:mb-8" style="color: var(--terminal-ink-dim);">
              Tracks built around real-world artifacts — pull requests, postmortems, and runbooks. No filler.
            </p>
          </BlurFade>

          {#if tabs.length > 1}
            <BlurFade delay={0.2} once={true}>
              <div
                class="ui:inline-flex ui:items-center ui:gap-0.5 ui:p-1 ui:rounded-full ui:mb-8"
                style="border: 1px solid var(--terminal-line-strong); background: var(--terminal-bg-card);"
                role="tablist"
              >
                {#each tabs as tab (tab.key)}
                  {@const isActive = activeTab === tab.key}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onclick={() => (activeTab = tab.key)}
                    class="ui:px-3.5 ui:py-1.5 ui:text-[13px] ui:font-medium ui:rounded-full ui:transition-colors"
                    style={isActive
                      ? 'background: var(--terminal-ink); color: var(--terminal-bg);'
                      : 'background: transparent; color: var(--terminal-ink-dim);'}
                  >
                    {tab.label}
                  </button>
                {/each}
              </div>
            </BlurFade>
          {/if}

          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-[14px]">
            {#each visibleCourses as course, index (course.id)}
              <BlurFade delay={0.04 * index} once={true}>
                <a
                  href={disableCourseLinks
                    ? undefined
                    : course.link || (course.slug ? `/course/${course.slug}` : undefined)}
                  aria-disabled={disableCourseLinks}
                  tabindex={disableCourseLinks ? -1 : undefined}
                  class="ui:relative ui:flex ui:flex-col ui:gap-2.5 ui:p-6 ui:rounded-xl ui:no-underline ui:transition-colors ui:h-full"
                  style="
                    background: linear-gradient(180deg, var(--terminal-bg-card) 0%, var(--terminal-bg-soft) 100%);
                    border: 1px solid var(--terminal-line);
                    color: var(--terminal-ink);
                    min-height: 180px;
                    cursor: {disableCourseLinks ? 'default' : 'pointer'};
                  "
                  onmouseenter={(e) =>
                    !disableCourseLinks && (e.currentTarget.style.borderColor = 'var(--terminal-line-strong)')}
                  onmouseleave={(e) => (e.currentTarget.style.borderColor = 'var(--terminal-line)')}
                >
                  <span class="ui:font-mono ui:text-[11px] ui:tracking-[0.04em]" style="color: var(--primary);">
                    $ {slugify(course)}
                  </span>
                  <h3
                    class="ui:text-[17px] ui:font-semibold ui:leading-snug ui:m-0"
                    style="color: var(--terminal-ink); letter-spacing: -0.01em;"
                  >
                    {course.title}
                  </h3>
                  <p
                    class="ui:text-[13.5px] ui:leading-[1.5] ui:m-0 ui:flex-1 ui:line-clamp-3"
                    style="color: var(--terminal-ink-dim);"
                  >
                    {course.description}
                  </p>
                  <div
                    class="ui:flex ui:items-center ui:justify-between ui:pt-3.5 ui:font-mono ui:text-[12px]"
                    style="border-top: 1px dashed var(--terminal-line);"
                  >
                    <span style="color: var(--terminal-ink);">{priceLabel(course)}</span>
                    <span aria-hidden="true" style="color: var(--terminal-ink-dim);">→</span>
                  </div>
                </a>
              </BlurFade>
            {/each}
          </div>

          {#if hasMoreCourses}
            <div class="ui:mt-7 ui:flex ui:justify-center">
              <Button
                href={disableCourseLinks ? undefined : '/courses'}
                variant="outline"
                disabled={disableCourseLinks}
                class="ui:rounded-full ui:px-5 ui:bg-transparent ui:border-[var(--terminal-line-strong)] ui:text-[var(--terminal-ink)] ui:hover:bg-white/5"
              >
                View all programs →
              </Button>
            </div>
          {/if}
        </div>
      </section>
    {/if}
  </main>

  <OrgLandingPageLinks {links} variant="terminal" />

  <OrgLandingPageEmbed {embed} variant="terminal" />

  <OrgLandingPageCallout {callout} variant="terminal" />

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="terminal" />
</div>
