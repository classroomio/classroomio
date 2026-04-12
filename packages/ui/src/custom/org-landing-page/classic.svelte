<script lang="ts">
  import type { Component } from 'svelte';
  import type { OrgLandingPageProps } from './types';
  import OrgLandingPageEmbed from './embed.svelte';
  import OrgLandingPageCallout from './callout.svelte';
  import OrgLandingPageFooter from './landing-page-footer.svelte';
  import ClassicNav from './classic/nav.svelte';
  import ClassicHero from './classic/hero.svelte';
  import { Button } from '../../base/button';
  import * as Item from '../../base/item';
  import { BlurFade } from '../animation/blurfade';
  import { CourseCard } from '../course-card';
  import TagIcon from '@lucide/svelte/icons/tag';
  import { calcCourseDiscount, formatExerciseCountLabel, getPrimaryCourseTag } from './landing-page-utils';
  import { cn } from '../../tools';

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

  const COURSE_TAG_ICON: Component = TagIcon;
</script>

<div class="ui:min-h-screen ui:bg-muted/10 ui:text-foreground ui:font-sans">
  <ClassicNav {orgName} {logoUrl} {navItems} {authAction} />

  <main>
    <ClassicHero {hero} />

    <section class="ui:py-10 ui:px-6 ui:lg:px-8 ui:max-w-7xl ui:mx-auto">
      <div class="ui:text-center ui:mb-8">
        <BlurFade delay={0} once={true}>
          <h2 class="ui:text-3xl ui:font-bold ui:text-foreground">Featured Programs</h2>
        </BlurFade>
        <BlurFade delay={0.15} once={true}>
          <div class="ui:mt-6 ui:h-px ui:w-24 ui:bg-border ui:mx-auto"></div>
        </BlurFade>
      </div>

      <div class="ui:grid ui:grid-cols-1 ui:sm:grid-cols-2 ui:lg:grid-cols-3 ui:gap-8 ui:justify-items-center">
        {#each courses as course, index (course.id)}
          {@const primaryTag = getPrimaryCourseTag(course)}
          {@const pricingData = {
            cost: course.cost ?? 0,
            discount: course.metadata?.discount ?? 0,
            showDiscount: !!course.metadata?.showDiscount
          }}
          {@const displayCost = calcCourseDiscount(pricingData.discount, pricingData.cost, pricingData.showDiscount)}
          {@const currencyFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: course.currency ?? 'USD'
          })}
          <BlurFade delay={0.1 * index} once={true} class="ui:w-full ui:flex ui:justify-center">
            <CourseCard
              href={disableCourseLinks ? undefined : course.link || `/course/${course.slug || course.id}`}
              bannerImage={course.logo || ''}
              bannerAlt={course.title}
              title={course.title}
              description={course.description}
              typeBadge={primaryTag
                ? {
                    label: primaryTag.name,
                    icon: COURSE_TAG_ICON,
                    iconClass: primaryTag.color ? '' : 'custom ui:text-primary'
                  }
                : undefined}
              class={cn('ui:group ui:relative', !disableCourseLinks && 'ui:hover:shadow-md ui:transition-shadow')}
            >
              {#snippet tags()}
                {#if course.tags && course.tags.length > 0}
                  <div class="ui:flex ui:flex-wrap ui:gap-1 ui:min-w-0">
                    {#each course.tags as tag (tag.id)}
                      <Item.SubDescription
                        class="ui:border-border ui:inline-flex ui:shrink-0 ui:items-center ui:gap-1.5 ui:rounded-full ui:border ui:px-2"
                      >
                        <span
                          class="ui:bg-primary/60 ui:inline-block ui:h-1.5 ui:w-1.5 ui:shrink-0 ui:rounded-full"
                          style={tag.color ? `background-color: ${tag.color}` : undefined}
                          aria-hidden="true"
                        ></span>
                        <span>{tag.name}</span>
                      </Item.SubDescription>
                    {/each}
                  </div>
                {/if}
              {/snippet}

              {#snippet footer()}
                <div class="ui:flex ui:justify-between ui:w-full">
                  <div class="ui:w-[80%]">
                    <p class="ui:text-xs ui:pl-2 ui:dark:text-white">
                      <span>{course.lessonCount || 0} lessons</span>
                      &
                      <span>{formatExerciseCountLabel(course.exerciseCount ?? 0)}</span>
                    </p>
                    <div class="ui:py-2 ui:text-xs">
                      {#if course.price != null && String(course.price).length > 0}
                        <span class="ui:px-2">{course.price}</span>
                      {:else if !displayCost}
                        <span class="ui:px-2">Free</span>
                      {:else if pricingData.showDiscount}
                        <span class="ui:px-2">
                          {currencyFormatter.format(displayCost)}
                          <span class="line-through">
                            {currencyFormatter.format(pricingData.cost)}
                          </span>
                        </span>
                      {:else}
                        <span class="ui:px-2">{currencyFormatter.format(displayCost)}</span>
                      {/if}
                    </div>
                  </div>
                </div>
              {/snippet}
            </CourseCard>
          </BlurFade>
        {/each}
      </div>

      {#if hasMoreCourses}
        <div class="ui:mt-12 ui:flex ui:justify-center">
          <Button
            href={disableCourseLinks ? undefined : '/courses'}
            variant="outline"
            size="lg"
            class="ui:px-8"
            disabled={disableCourseLinks}
          >
            View more courses
          </Button>
        </div>
      {/if}
    </section>
  </main>

  <OrgLandingPageEmbed {embed} variant="classic" />

  <OrgLandingPageCallout {callout} variant="classic" />

  <OrgLandingPageFooter {orgName} {logoUrl} {footerLinks} {footerText} variant="classic" />
</div>
