<script lang="ts">
  import type { OrgLandingPageProps } from './types';
  import OrgLandingPageEmbed from './embed.svelte';
  import OrgLandingPageLinks from './links.svelte';
  import OrgLandingPageCallout from './callout.svelte';
  import OrgLandingPageFooter from './landing-page-footer.svelte';
  import StudioNav from './studio/nav.svelte';
  import StudioHero from './studio/hero.svelte';
  import { Button } from '../../base/button';
  import { BlurFade } from '../animation/blurfade';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
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
    <StudioHero {hero} {courses}>
      {#snippet navigation()}
        <StudioNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </StudioHero>

    {#if courses.length > 0}
      <section class="ui:py-24 ui:px-6 ui:border-t ui:border-border">
        <div class="ui:max-w-[1080px] ui:mx-auto">
          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:gap-12 ui:items-end ui:mb-12">
            <div>
              <p class="ui:text-sm ui:text-muted-foreground ui:mb-1.5 ui:inline-flex ui:items-center ui:gap-2">
                <span class="ui:size-1.5 ui:rounded-full ui:bg-primary"></span>
                Catalog
              </p>
              <h2 class="ui:text-3xl ui:lg:text-4xl ui:font-semibold ui:tracking-tight ui:m-0">
                Programs your team can actually finish.
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
                  Browse all →
                </Button>
              </div>
            {/if}
          </div>

          <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-3">
            {#each courses as course, index (course.id)}
              {@const courseTypeMeta = getCourseTypeLandingMeta(course)}
              <BlurFade delay={0.06 * index} once={true}>
                <a
                  href={disableCourseLinks
                    ? undefined
                    : course.link || (course.slug ? `/course/${course.slug}` : undefined)}
                  class="ui:group ui:flex ui:flex-col ui:h-full ui:bg-card ui:border ui:border-border ui:rounded-xl ui:overflow-hidden ui:transition-colors ui:no-underline {disableCourseLinks
                    ? 'ui:cursor-default'
                    : 'ui:hover:border-foreground/30'}"
                  aria-disabled={disableCourseLinks}
                  tabindex={disableCourseLinks ? -1 : undefined}
                >
                  <div
                    class="ui:relative ui:h-[200px] ui:bg-muted/50 ui:border-b ui:border-border ui:p-5 ui:overflow-hidden"
                  >
                    {#if course.logo}
                      <img
                        src={course.logo}
                        alt=""
                        class="ui:absolute ui:inset-0 ui:w-full ui:h-full ui:object-cover ui:opacity-60"
                      />
                    {/if}
                    <div
                      class="ui:relative ui:flex ui:items-start ui:justify-between"
                      style="background: linear-gradient(180deg, transparent 60%, var(--card) 100%);"
                    >
                      {#if courseTypeMeta}
                        <span
                          class="ui:inline-flex ui:items-center ui:gap-1.5 ui:px-2 ui:py-0.5 ui:bg-background/95 ui:border ui:border-border ui:rounded-md ui:text-[11px] ui:font-medium ui:text-foreground"
                        >
                          {courseTypeMeta.label}
                        </span>
                      {/if}
                    </div>
                  </div>
                  <div class="ui:p-5 ui:flex ui:items-end ui:justify-between ui:gap-3 ui:flex-1">
                    <div class="ui:flex-1 ui:min-w-0">
                      <p class="ui:text-[13px] ui:text-muted-foreground ui:mb-1.5 ui:m-0">
                        {course.price || formatCurrency(course.cost, course.currency)}
                      </p>
                      <h3 class="ui:text-base ui:font-medium ui:tracking-tight ui:leading-snug ui:m-0">
                        {course.title}
                      </h3>
                    </div>
                    <span
                      class="ui:flex-shrink-0 ui:inline-flex ui:items-center ui:justify-center ui:size-8 ui:rounded-full ui:border ui:border-border ui:text-muted-foreground ui:group-hover:bg-foreground ui:group-hover:text-background ui:group-hover:border-foreground ui:transition-colors"
                      aria-hidden="true"
                    >
                      <ArrowRightIcon class="ui:size-3.5" />
                    </span>
                  </div>
                </a>
              </BlurFade>
            {/each}
          </div>
        </div>
      </section>
    {/if}
  </main>

  <OrgLandingPageLinks {links} variant="studio" />

  <OrgLandingPageEmbed {embed} variant="studio" />

  <OrgLandingPageCallout {callout} variant="studio" />

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="studio" />
</div>
