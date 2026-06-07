<script lang="ts">
  import type { OrgLandingPageProps, CourseItem } from '../types';
  import OrgLandingPageEmbed from '../embed.svelte';
  import OrgLandingPageLinks from '../links.svelte';
  import OrgLandingPageCallout from '../callout.svelte';
  import OrgLandingPageFooter from '../landing-page-footer.svelte';
  import VibrantNav from './nav.svelte';
  import VibrantHero from './hero.svelte';
  import VibrantCourseCard from './course-card.svelte';
  import { themeStyle } from '../theme-style';
  import { Button } from '../../../base/button';
  import { getCourseTypeLandingMeta, defaultLessonsLabel, defaultExercisesLabel } from '../landing-page-utils';

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

  const featured = $derived(courses[0]);
  const featuredTypeMeta = $derived(featured ? getCourseTypeLandingMeta(featured) : undefined);
  const remainingCourses = $derived(courses.slice(1));

  const resolvedLessonsLabel = $derived(labels?.lessonsLabel ?? defaultLessonsLabel);
  const resolvedExercisesLabel = $derived(labels?.exercisesLabel ?? defaultExercisesLabel);

  function formatCost(cost?: number, currency = 'USD'): string {
    if (!cost) return labels?.freeLabel ?? 'Free';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cost);
  }

  function courseHref(course: CourseItem): string | undefined {
    if (disableCourseLinks) return undefined;
    return course.link || (course.slug ? `/course/${course.slug}` : undefined);
  }
</script>

<div
  class="ui:min-h-screen ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)] ui:font-sans"
  style={themeStyle('vibrant')}
>
  <main>
    <VibrantHero {hero} {labels}>
      {#snippet navigation()}
        <VibrantNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </VibrantHero>

    {#if featured}
      <section
        class="ui:bg-[var(--landing-accent)] ui:text-[var(--landing-accent-fg)] ui:px-6 ui:md:px-8 ui:py-24 ui:md:py-32"
      >
        <div class="ui:max-w-[1320px] ui:mx-auto">
          <div class="ui:grid ui:grid-cols-1 ui:lg:grid-cols-[1.15fr_1fr] ui:gap-12 ui:lg:gap-20 ui:items-center">
            <div>
              {#if featuredTypeMeta}
                <span
                  class="ui:inline-flex ui:items-center ui:gap-1.5 ui:rounded-full ui:px-3 ui:py-1 ui:text-[13px] ui:font-medium ui:mb-6 ui:text-[var(--landing-accent-fg)]"
                  style="background: rgba(255,255,255,0.18);"
                >
                  {labels?.featuredLabel ?? 'Featured'} · {featuredTypeMeta.label}
                </span>
              {/if}
              <h2
                class="ui:text-4xl ui:md:text-5xl ui:lg:text-[56px] ui:font-medium ui:tracking-tight ui:m-0 ui:mb-6 ui:max-w-[520px]"
                style="line-height: 1.05; letter-spacing: -0.025em;"
              >
                {featured.title}
              </h2>
              <p class="ui:text-lg ui:m-0 ui:mb-4 ui:max-w-[480px] ui:opacity-90" style="line-height: 1.5;">
                {featured.description}
              </p>
              <div
                class="ui:flex ui:flex-wrap ui:items-center ui:gap-x-5 ui:gap-y-2 ui:text-[14.5px] ui:mb-8 ui:opacity-85"
              >
                {#if featured.lessonCount}
                  <span>{resolvedLessonsLabel(featured.lessonCount)}</span>
                {/if}
                {#if featured.exerciseCount}
                  <span aria-hidden="true">·</span>
                  <span>{resolvedExercisesLabel(featured.exerciseCount)}</span>
                {/if}
                {#if featured.duration}
                  <span aria-hidden="true">·</span>
                  <span>{featured.duration}</span>
                {/if}
              </div>
              <div class="ui:flex ui:flex-wrap ui:items-center ui:gap-3">
                <Button
                  href={courseHref(featured)}
                  disabled={disableCourseLinks}
                  class="ui:rounded-md ui:px-6 ui:py-3 ui:text-base ui:font-medium ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)] ui:hover:opacity-90"
                >
                  {labels?.startCourseLabel ?? 'Start this course'}
                </Button>
                <span class="ui:text-base ui:font-medium ui:opacity-95">
                  {featured.price || formatCost(featured.cost, featured.currency)}
                </span>
              </div>
            </div>

            <div
              class="ui:relative ui:overflow-hidden ui:rounded-3xl ui:h-[440px] ui:md:h-[480px]"
              style="
                background:
                  radial-gradient(50% 60% at 40% 40%, rgba(255,255,255,0.55) 0%, transparent 70%),
                  radial-gradient(60% 70% at 70% 65%, rgba(255,255,255,0.32) 0%, transparent 70%),
                  radial-gradient(40% 50% at 25% 75%, rgba(255,235,210,0.5) 0%, transparent 70%),
                  linear-gradient(135deg, #b0a8a0 0%, #d4cabd 50%, #c8c0b5 100%);
              "
            >
              <div
                class="ui:absolute ui:left-1/2 ui:top-1/2 ui:w-[80%] ui:overflow-hidden ui:rounded-2xl ui:p-6"
                style="
                  transform: translate(-50%, -50%);
                  background: #0c1320;
                  color: #fff;
                  box-shadow: 0 30px 60px -20px rgba(0,0,0,0.35);
                "
              >
                <p class="ui:m-0 ui:mb-1 ui:text-[16px] ui:font-semibold">Course outline</p>
                <p class="ui:m-0 ui:mb-5 ui:text-[13px]" style="color: #8a93a0;">
                  Pick up where you left off — anytime.
                </p>
                <div class="ui:flex ui:flex-col ui:gap-2">
                  {#each Array.from({ length: Math.min(featured.lessonCount ?? 4, 4) }) as _, idx (idx)}
                    <div
                      class="ui:flex ui:items-center ui:gap-3 ui:rounded-lg ui:px-3.5 ui:py-3"
                      style="background: #131c2c;"
                    >
                      <span
                        class="ui:inline-flex ui:items-center ui:justify-center ui:size-6 ui:rounded ui:text-[11px] ui:font-semibold ui:tabular-nums"
                        style="background: #2a3548; color: #fff;"
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span class="ui:flex-1 ui:text-[13.5px] ui:font-medium" style="color: #fff;">
                        {idx === 0
                          ? 'Foundations & setup'
                          : idx === 1
                            ? 'Core concepts'
                            : idx === 2
                              ? 'Hands-on practice'
                              : 'Capstone project'}
                      </span>
                      <span class="ui:text-[11.5px] ui:tabular-nums" style="color: #6c7585;">
                        {idx === 0 ? '42 min' : idx === 1 ? '1h 12m' : idx === 2 ? '58 min' : '2h 30m'}
                      </span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    {/if}

    {#if remainingCourses.length > 0 || (!featured && courses.length > 0)}
      {@const catalogCourses = featured ? remainingCourses : courses}
      <section id="courses" class="ui:px-6 ui:md:px-8 ui:py-24 ui:md:py-28 ui:bg-[var(--landing-bg)]">
        <div class="ui:max-w-[1320px] ui:mx-auto">
          <div class="ui:flex ui:flex-col ui:md:flex-row ui:md:items-end ui:justify-between ui:gap-6 ui:mb-12">
            <div>
              <p
                class="ui:text-[13px] ui:font-medium ui:tracking-[0.08em] ui:uppercase ui:text-[var(--landing-fg-muted)] ui:m-0 ui:mb-3"
              >
                {labels?.catalogEyebrow ?? 'Catalog'}
              </p>
              <h2
                class="ui:text-4xl ui:md:text-5xl ui:font-medium ui:tracking-tight ui:m-0 ui:text-[var(--landing-fg)] ui:max-w-2xl"
                style="line-height: 1.05; letter-spacing: -0.025em;"
              >
                {labels?.catalogHeading ?? 'More courses to take next.'}
              </h2>
            </div>
            {#if hasMoreCourses}
              <Button
                href={disableCourseLinks ? undefined : '/courses'}
                variant="outline"
                class="ui:rounded-md ui:px-5 ui:py-2.5 ui:font-medium ui:border-[var(--landing-border)] ui:text-[var(--landing-fg)] ui:hover:bg-[var(--landing-card-soft)]"
                disabled={disableCourseLinks}
              >
                {labels?.browseCoursesLabel ?? 'Browse all →'}
              </Button>
            {/if}
          </div>

          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-5">
            {#each catalogCourses as course, index (course.id)}
              <VibrantCourseCard {course} {disableCourseLinks} {labels} />
            {/each}
          </div>
        </div>
      </section>
    {/if}
  </main>

  <OrgLandingPageLinks {links} {labels} variant="vibrant" />

  <OrgLandingPageEmbed {embed} {labels} variant="vibrant" />

  <OrgLandingPageCallout {callout} {labels} variant="vibrant" />

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="vibrant" />
</div>
