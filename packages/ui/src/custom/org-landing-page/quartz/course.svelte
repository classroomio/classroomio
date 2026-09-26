<script lang="ts">
  import type { CourseLandingPageProps } from '../types';
  import QuartzNav from './nav.svelte';
  import QuartzHero from './hero.svelte';
  import QuartzFooter from './footer.svelte';
  import QuartzCourseInfo from './course-info.svelte';
  import QuartzCourseCurriculum from './course-curriculum.svelte';
  import QuartzCourseChips from './course-chips.svelte';
  import QuartzCourseInstructor from './course-instructor.svelte';
  import QuartzCourseReviews from './course-reviews.svelte';
  import QuartzCourseRail from './course-rail.svelte';
  import QuartzCourseByline from './course-byline.svelte';
  import LandingThemeScope from '../landing-theme-scope.svelte';
  import { alignHeroCtaWithPricing } from '../course-landing-page.helpers';

  let {
    orgName,
    logoUrl,
    navItems,
    authAction,
    learnerAccount,
    hero,
    socialProof,
    info,
    curriculum,
    chips,
    instructor,
    reviews,
    pricing,
    footer,
    labels
  }: CourseLandingPageProps = $props();

  const heroProps = $derived(alignHeroCtaWithPricing(hero, pricing));
  /** Stats are already covered by the byline row, so they are stripped before the hero renders. */
  const heroForCourse = $derived({ ...heroProps, stats: undefined });
</script>

<LandingThemeScope theme="quartz" class="ui:font-sans">
  <QuartzNav {orgName} {logoUrl} {navItems} {authAction} {learnerAccount} />

  <main class="ui:@container ui:max-w-[1200px] ui:mx-auto ui:border-x ui:border-[var(--landing-border)]">
    <QuartzHero hero={heroForCourse} imageFit="natural" compact />

    <QuartzCourseByline {instructor} {socialProof} {curriculum} {labels} />

    <div class="ui:bg-[var(--landing-card)]">
      <div class="ui:grid ui:grid-cols-1 ui:@4xl:grid-cols-[minmax(0,1fr)_330px]">
        <div class="ui:min-w-0 ui:@4xl:border-r ui:border-[var(--landing-border)]">
          <QuartzCourseInfo {info} {labels} />
          <QuartzCourseCurriculum {curriculum} {labels} />
          {#if chips}
            <QuartzCourseChips {chips} {labels} />
          {/if}
          <QuartzCourseInstructor {instructor} {labels} />
          <QuartzCourseReviews {reviews} {labels} />
        </div>

        <QuartzCourseRail {pricing} {socialProof} {curriculum} {labels} />
      </div>
    </div>
  </main>

  <QuartzFooter {orgName} {logoUrl} {footer} />
</LandingThemeScope>
