<script lang="ts">
  import type { CourseLandingPageProps } from '../types';
  import MinimalNav from './nav.svelte';
  import MinimalHero from './hero.svelte';
  import OrgLandingPageFooter from '../landing-page-footer.svelte';
  import CourseSocialProof from '../course-social-proof.svelte';
  import CourseInfoBlocks from '../course-info-blocks.svelte';
  import CourseCurriculum from '../course-curriculum.svelte';
  import CourseChips from '../course-chips.svelte';
  import CourseSectionNav from '../course-section-nav.svelte';
  import CourseInstructor from '../course-instructor.svelte';
  import CourseReviews from '../course-reviews.svelte';
  import CoursePricing from '../course-pricing.svelte';
  import { themeStyle } from '../theme-style';
  import { alignHeroCtaWithPricing, buildCourseSectionNavItems } from '../course-landing-page.helpers';

  let {
    orgName,
    logoUrl,
    navItems,
    authAction,
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
  const sectionNavItems = $derived(
    buildCourseSectionNavItems({ info, curriculum, chips, instructor, reviews }, labels)
  );
</script>

<div
  class="ui:min-h-screen ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)] ui:font-sans"
  style={themeStyle('minimal')}
>
  <main>
    <MinimalHero hero={heroProps}>
      {#snippet navigation()}
        <MinimalNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </MinimalHero>

    <CourseSectionNav variant="minimal" items={sectionNavItems} {labels} />
    <CourseSocialProof variant="minimal" {socialProof} {labels} />
    <CourseInfoBlocks variant="minimal" {info} {labels} />
    <CourseCurriculum variant="minimal" {curriculum} {labels} />
    {#if chips}
      <CourseChips variant="minimal" {chips} {labels} />
    {/if}
    <CourseInstructor variant="minimal" {instructor} {labels} />
    <CourseReviews variant="minimal" {reviews} {labels} />
    <CoursePricing variant="minimal" {pricing} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="minimal" />
</div>
