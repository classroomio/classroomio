<script lang="ts">
  import type { CourseLandingPageProps } from '../types';
  import CorporateNav from './nav.svelte';
  import CorporateHero from './hero.svelte';
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
  style={themeStyle('corporate')}
>
  <main>
    <CorporateHero {orgName} hero={heroProps}>
      {#snippet navigation()}
        <CorporateNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </CorporateHero>

    <CourseSectionNav variant="corporate" items={sectionNavItems} {labels} />
    <CourseSocialProof variant="corporate" {socialProof} {labels} />
    <CourseInfoBlocks variant="corporate" {info} {labels} />
    <CourseCurriculum variant="corporate" {curriculum} {labels} />
    {#if chips}
      <CourseChips variant="corporate" {chips} {labels} />
    {/if}
    <CourseInstructor variant="corporate" {instructor} {labels} />
    <CourseReviews variant="corporate" {reviews} {labels} />
    <CoursePricing variant="corporate" {pricing} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="corporate" />
</div>
