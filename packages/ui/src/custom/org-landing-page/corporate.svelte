<script lang="ts">
  import type { OrgLandingPageProps } from './types';
  import OrgLandingPageEmbed from './embed.svelte';
  import OrgLandingPageLinks from './links.svelte';
  import OrgLandingPageCallout from './callout.svelte';
  import OrgLandingPageFooter from './landing-page-footer.svelte';
  import CorporateNav from './corporate/nav.svelte';
  import CorporateHero from './corporate/hero.svelte';
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

  function formatCurrency(cost?: number, currency = 'USD') {
    if (!cost) return 'Free';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cost);
  }
</script>

<div class="ui:min-h-screen ui:bg-background ui:text-foreground ui:font-sans">
  <main>
    <CorporateHero {orgName} {hero}>
      {#snippet navigation()}
        <CorporateNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </CorporateHero>

    {#if courses.length > 0}
      <section class="ui:py-24 ui:px-6 ui:border-t ui:border-border">
        <div class="ui:max-w-[1120px] ui:mx-auto">
          <div class="ui:flex ui:items-end ui:justify-between ui:flex-wrap ui:gap-4 ui:mb-10">
            <div>
              <p class="ui:text-xs ui:font-semibold ui:tracking-widest ui:uppercase ui:text-foreground ui:mb-3">
                Catalog
              </p>
              <h2 class="ui:text-3xl ui:lg:text-4xl ui:font-semibold ui:tracking-tight ui:m-0 ui:max-w-xl">
                Programs your teams are taking
              </h2>
            </div>
            {#if hasMoreCourses}
              <Button
                href={disableCourseLinks ? undefined : '/courses'}
                variant="outline"
                class="ui:rounded-none ui:font-medium"
                disabled={disableCourseLinks}
              >
                Browse catalog →
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
                  class="ui:flex ui:flex-col ui:h-full ui:p-6 ui:gap-2 ui:border-r ui:border-b ui:border-border ui:bg-background ui:transition-colors ui:no-underline {disableCourseLinks
                    ? 'ui:cursor-default'
                    : 'ui:hover:bg-muted/30'}"
                  aria-disabled={disableCourseLinks}
                  tabindex={disableCourseLinks ? -1 : undefined}
                >
                  {#if courseTypeMeta}
                    <span
                      class="ui:text-[11px] ui:font-semibold ui:tracking-widest ui:uppercase ui:text-muted-foreground ui:mb-1"
                    >
                      {courseTypeMeta.label}
                    </span>
                  {/if}
                  <h3 class="ui:text-lg ui:font-semibold ui:tracking-tight ui:leading-snug ui:m-0">
                    {course.title}
                  </h3>
                  <p class="ui:text-sm ui:text-muted-foreground ui:leading-relaxed ui:line-clamp-3 ui:flex-1 ui:m-0">
                    {course.description}
                  </p>
                  <div class="ui:flex ui:items-center ui:justify-between ui:pt-4 ui:mt-3 ui:border-t ui:border-border">
                    <span class="ui:text-sm ui:font-semibold">
                      {course.price || formatCurrency(course.cost, course.currency)}
                    </span>
                    <span class="ui:text-sm ui:text-foreground ui:underline ui:underline-offset-4" aria-hidden="true">
                      Enroll →
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

  <OrgLandingPageLinks {links} variant="corporate" />

  <OrgLandingPageEmbed {embed} variant="corporate" />

  <OrgLandingPageCallout {callout} variant="corporate" />

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="corporate" />
</div>
