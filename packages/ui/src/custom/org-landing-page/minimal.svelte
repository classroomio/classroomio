<script lang="ts">
  import type { OrgLandingPageProps } from './types';
  import OrgLandingPageEmbed from './embed.svelte';
  import OrgLandingPageCallout from './callout.svelte';
  import OrgLandingPageFooter from './landing-page-footer.svelte';
  import MinimalNav from './minimal/nav.svelte';
  import MinimalHero from './minimal/hero.svelte';
  import { Button } from '../../base/button';
  import { BlurFade } from '../animation/blurfade';
  import * as Card from '../../base/card';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import TagIcon from '@lucide/svelte/icons/tag';
  import { getPrimaryCourseTag } from './landing-page-utils';

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
    footerLinks,
    footerText
  }: OrgLandingPageProps = $props();

  function formatCurrency(cost?: number, currency = 'USD') {
    if (!cost) return 'Free';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cost);
  }
</script>

<div class="ui:min-h-screen ui:bg-background ui:text-foreground ui:font-sans">
  <main>
    <MinimalHero {hero}>
      {#snippet navigation()}
        <MinimalNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </MinimalHero>

    <section class="ui:py-20 ui:px-4">
      <div class="ui:max-w-[1200px] ui:mx-auto">
        <h2 class="ui:text-2xl ui:font-semibold ui:mb-8">Our Courses</h2>
        <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:gap-6">
          {#each courses as course, index (course.id)}
            {@const primaryTag = getPrimaryCourseTag(course)}
            <BlurFade delay={0.1 * index} once={true}>
              <a
                href={disableCourseLinks
                  ? undefined
                  : course.link || (course.slug ? `/course/${course.slug}` : undefined)}
                class="ui:block ui:h-full ui:no-underline {disableCourseLinks
                  ? 'ui:cursor-default'
                  : 'ui:transition-colors'}"
                aria-disabled={disableCourseLinks}
                tabindex={disableCourseLinks ? -1 : undefined}
              >
                <Card.Root
                  class="ui:rounded-none ui:border-border/60 ui:shadow-none ui:h-full ui:p-0 ui:gap-0 {disableCourseLinks
                    ? ''
                    : 'ui:hover:border-border ui:transition-colors'}"
                >
                  <Card.Content class="ui:p-8 ui:flex ui:flex-col ui:flex-1">
                    <Card.Title class="ui:text-xl ui:font-normal ui:mb-4">{course.title}</Card.Title>
                    <Card.Description class="ui:mb-8 ui:line-clamp-3 ui:text-base ui:leading-relaxed">
                      {course.description}
                    </Card.Description>

                    <div class="ui:flex ui:items-center ui:gap-6 ui:text-sm ui:mt-auto">
                      {#if course.duration}
                        <div class="ui:flex ui:items-center ui:gap-1.5 ui:text-muted-foreground">
                          <ClockIcon class="ui:size-4" />
                          <span>{course.duration}</span>
                        </div>
                      {/if}
                      {#if primaryTag}
                        <div class="ui:flex ui:items-center ui:gap-1.5 ui:text-muted-foreground">
                          <TagIcon class="ui:size-4" />
                          {#if primaryTag.color}
                            <span
                              class="ui:inline-block ui:h-2 ui:w-2 ui:rounded-full"
                              style={`background-color: ${primaryTag.color}`}
                              aria-hidden="true"
                            ></span>
                          {/if}
                          <span>{primaryTag.name}</span>
                        </div>
                      {/if}
                      <div class="ui:ml-auto ui:font-semibold">
                        {course.price || formatCurrency(course.cost, course.currency)}
                      </div>
                    </div>
                  </Card.Content>
                </Card.Root>
              </a>
            </BlurFade>
          {/each}
        </div>

        {#if hasMoreCourses}
          <div class="ui:mt-10 ui:flex ui:justify-center">
            <Button
              href={disableCourseLinks ? undefined : '/courses'}
              variant="outline"
              size="lg"
              disabled={disableCourseLinks}
            >
              View more courses
            </Button>
          </div>
        {/if}
      </div>
    </section>
  </main>

  <OrgLandingPageEmbed {embed} variant="minimal" />

  <OrgLandingPageCallout {callout} variant="minimal" />

  <OrgLandingPageFooter {orgName} {logoUrl} {footerLinks} {footerText} variant="minimal" />
</div>
