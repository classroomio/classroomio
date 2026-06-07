<script lang="ts">
  import type { CourseLandingPageProps } from '../types';
  import ClassicNav from './nav.svelte';
  import ClassicHero from './hero.svelte';
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
  class="ui:min-h-screen ui:bg-[var(--landing-bg-section)] ui:text-[var(--landing-fg)] ui:font-sans"
  style={themeStyle('classic')}
>
  <ClassicNav {orgName} {logoUrl} {navItems} {authAction} />

  <main>
    <ClassicHero hero={heroProps} />

    <CourseSectionNav variant="classic" items={sectionNavItems} {labels} />
    <CourseSocialProof variant="classic" {socialProof} {labels} />
    <CourseInfoBlocks variant="classic" {info} {labels} />
    <CourseCurriculum variant="classic" {curriculum} {labels} />
    {#if chips}
      <CourseChips variant="classic" {chips} {labels} />
    {/if}
    <CourseInstructor variant="classic" {instructor} {labels} />
    <CourseReviews variant="classic" {reviews} {labels} />
    <CoursePricing variant="classic" {pricing} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="classic" />
</div>
