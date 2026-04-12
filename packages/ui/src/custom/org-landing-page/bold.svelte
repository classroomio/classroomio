<script lang="ts">
  import type { OrgLandingPageProps } from './types';
  import OrgLandingPageEmbed from './embed.svelte';
  import OrgLandingPageCallout from './callout.svelte';
  import OrgLandingPageFooter from './landing-page-footer.svelte';
  import BoldNav from './bold/nav.svelte';
  import BoldHero from './bold/hero.svelte';
  import { Button } from '../../base/button';
  import * as Card from '../../base/card';
  import { BlurFade } from '../animation/blurfade';
  import { BorderBeam } from '../animation/border-beam';
  import { DotPattern } from '../animation/dot-pattern';
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
  <BoldNav {orgName} {logoUrl} {navItems} {authAction} />

  <main>
    <BoldHero {hero} />

    <section class="ui:relative ui:bg-muted/30 ui:px-6 ui:overflow-hidden">
      <DotPattern class="ui:opacity-[0.15]" />
      <div class="ui:relative ui:max-w-7xl ui:mx-auto">
        <div class="ui:flex ui:items-end ui:justify-between ui:mb-12">
          <h2 class="ui:text-4xl ui:font-black ui:tracking-tight">Latest Courses</h2>
        </div>
        <div class="ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:gap-8">
          {#each courses as course, index (course.id)}
            {@const primaryTag = getPrimaryCourseTag(course)}
            <BlurFade delay={0.1 * index} once={true}>
              <Card.Root
                class="ui:group ui:relative ui:overflow-hidden ui:bg-background ui:rounded-3xl ui:p-4 ui:flex-col ui:sm:flex-row ui:gap-6 ui:duration-300 ui:h-full ui:border-border/50 {disableCourseLinks
                  ? ''
                  : 'ui:hover:shadow-xl ui:hover:shadow-primary/5 ui:transition-all'}"
              >
                <BorderBeam
                  size={120}
                  duration={8}
                  colorFrom="var(--primary)"
                  colorTo="color-mix(in oklab, var(--primary) 65%, white)"
                />
                {#if course.logo}
                  <img
                    src={course.logo}
                    alt={course.title}
                    class="ui:w-full ui:sm:w-48 ui:h-48 ui:object-cover ui:rounded-2xl ui:group-hover:scale-[1.02] ui:transition-transform ui:duration-500"
                  />
                {/if}
                <Card.Content class="ui:p-2 ui:flex ui:flex-col ui:justify-center ui:flex-1">
                  <Card.Title class="ui:text-2xl ui:font-bold ui:mb-2">{course.title}</Card.Title>
                  <Card.Description class="ui:mb-6 ui:line-clamp-2">{course.description}</Card.Description>

                  <div class="ui:flex ui:items-center ui:gap-4 ui:text-sm ui:font-semibold ui:mb-6">
                    {#if course.duration}
                      <div
                        class="ui:flex ui:items-center ui:gap-1.5 ui:text-muted-foreground ui:bg-muted ui:px-2.5 ui:py-1 ui:rounded-md"
                      >
                        <ClockIcon class="ui:size-3.5" />
                        <span>{course.duration}</span>
                      </div>
                    {/if}
                    {#if primaryTag}
                      <div
                        class="ui:flex ui:items-center ui:gap-1.5 ui:text-foreground ui:bg-muted ui:px-2.5 ui:py-1 ui:rounded-md"
                      >
                        <TagIcon class="ui:size-3.5 ui:text-primary" />
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
                  </div>

                  <div class="ui:mt-auto ui:flex ui:items-center ui:justify-between">
                    <span class="ui:font-black ui:text-lg"
                      >{course.price || formatCurrency(course.cost, course.currency)}</span
                    >
                    <Button
                      href={disableCourseLinks ? undefined : course.link}
                      variant="outline"
                      class="ui:rounded-lg ui:font-bold ui:text-sm {disableCourseLinks
                        ? 'ui:pointer-events-none'
                        : 'ui:group-hover:bg-primary ui:group-hover:text-primary-foreground ui:transition-colors'}"
                      aria-disabled={disableCourseLinks}
                      tabindex={disableCourseLinks ? -1 : undefined}
                    >
                      Details
                    </Button>
                  </div>
                </Card.Content>
              </Card.Root>
            </BlurFade>
          {/each}
        </div>

        {#if hasMoreCourses}
          <div class="ui:mt-12 ui:flex ui:justify-center">
            <Button
              href={disableCourseLinks ? undefined : '/courses'}
              size="lg"
              class="ui:rounded-xl ui:px-8"
              disabled={disableCourseLinks}
            >
              View more courses
            </Button>
          </div>
        {/if}
      </div>
    </section>
  </main>

  <OrgLandingPageEmbed {embed} variant="bold" />

  <OrgLandingPageCallout {callout} variant="bold" />

  <OrgLandingPageFooter {orgName} {logoUrl} {footerLinks} {footerText} variant="bold" />
</div>
