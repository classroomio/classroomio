<script lang="ts">
  import type { OrgLandingPageProps } from './types';
  import OrgLandingPageEmbed from './embed.svelte';
  import OrgLandingPageLinks from './links.svelte';
  import OrgLandingPageCallout from './callout.svelte';
  import OrgLandingPageFooter from './landing-page-footer.svelte';
  import TechNav from './tech/nav.svelte';
  import TechHero from './tech/hero.svelte';
  import { Button } from '../../base/button';
  import { BlurFade } from '../animation/blurfade';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import ClockIcon from '@lucide/svelte/icons/clock';
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

  function formatCurrency(cost?: number, currency = 'USD') {
    if (!cost) return 'Free';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cost);
  }
</script>

<div class="ui:min-h-screen ui:bg-background ui:text-foreground ui:font-sans">
  <main>
    <TechHero {hero}>
      {#snippet navigation()}
        <TechNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </TechHero>

    {#if courses.length > 0}
      <section class="ui:py-24 ui:px-6">
        <div class="ui:max-w-[1280px] ui:mx-auto">
          <div class="ui:flex ui:items-end ui:justify-between ui:flex-wrap ui:gap-4 ui:mb-14">
            <div>
              <p class="ui:font-mono ui:text-xs ui:tracking-widest ui:uppercase ui:text-primary ui:mb-3">// catalog</p>
              <h2 class="ui:text-4xl ui:lg:text-5xl ui:font-extrabold ui:tracking-tight ui:m-0">Latest courses</h2>
            </div>
            {#if hasMoreCourses}
              <Button
                href={disableCourseLinks ? undefined : '/courses'}
                variant="outline"
                class="ui:rounded-none ui:font-mono ui:text-sm"
                disabled={disableCourseLinks}
              >
                view all →
              </Button>
            {/if}
          </div>

          <div
            class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:border-t ui:border-l ui:border-border"
          >
            {#each courses as course, index (course.id)}
              {@const courseTypeMeta = getCourseTypeLandingMeta(course)}
              <BlurFade delay={0.06 * index} once={true}>
                <a
                  href={disableCourseLinks
                    ? undefined
                    : course.link || (course.slug ? `/course/${course.slug}` : undefined)}
                  class="ui:flex ui:flex-col ui:h-full ui:p-7 ui:border-r ui:border-b ui:border-border ui:bg-background ui:transition-colors ui:no-underline {disableCourseLinks
                    ? 'ui:cursor-default'
                    : 'ui:hover:bg-muted/40'}"
                  aria-disabled={disableCourseLinks}
                  tabindex={disableCourseLinks ? -1 : undefined}
                >
                  {#if courseTypeMeta}
                    <span
                      class="ui:inline-block ui:self-start ui:px-2.5 ui:py-1 ui:bg-primary ui:text-primary-foreground ui:font-mono ui:text-[10px] ui:font-semibold ui:tracking-wider ui:uppercase ui:mb-4"
                    >
                      {courseTypeMeta.label}
                    </span>
                  {/if}
                  <h3 class="ui:text-xl ui:font-bold ui:tracking-tight ui:leading-tight ui:mb-3 ui:m-0">
                    {course.title}
                  </h3>
                  <p
                    class="ui:text-sm ui:text-muted-foreground ui:leading-relaxed ui:line-clamp-3 ui:flex-1 ui:m-0 ui:mb-5"
                  >
                    {course.description}
                  </p>
                  <div
                    class="ui:flex ui:items-center ui:justify-between ui:pt-4 ui:border-t ui:border-dashed ui:border-border"
                  >
                    <span class="ui:font-mono ui:text-sm ui:font-bold">
                      {course.price || formatCurrency(course.cost, course.currency)}
                    </span>
                    <span
                      class="ui:inline-flex ui:items-center ui:gap-1 ui:font-mono ui:text-xs ui:text-primary ui:font-bold"
                      aria-hidden="true"
                    >
                      enroll
                      <ArrowRightIcon class="ui:size-3.5" />
                    </span>
                  </div>
                  {#if course.duration}
                    <p
                      class="ui:font-mono ui:text-[11px] ui:text-muted-foreground ui:mt-3 ui:inline-flex ui:items-center ui:gap-1.5"
                    >
                      <ClockIcon class="ui:size-3" />
                      {course.duration}
                    </p>
                  {/if}
                </a>
              </BlurFade>
            {/each}
          </div>
        </div>
      </section>
    {/if}
  </main>

  <OrgLandingPageLinks {links} variant="tech" />

  <OrgLandingPageEmbed {embed} variant="tech" />

  <OrgLandingPageCallout {callout} variant="tech" />

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="tech" />
</div>
