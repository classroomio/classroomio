<script lang="ts">
  import type { CourseLandingPageProps } from '../types';
  import SaasNav from './nav.svelte';
  import SaasHero from './hero.svelte';
  import OrgLandingPageFooter from '../landing-page-footer.svelte';
  import CourseSocialProof from '../course-social-proof.svelte';
  import CourseInfoBlocks from '../course-info-blocks.svelte';
  import CourseCurriculum from '../course-curriculum.svelte';
  import CourseChips from '../course-chips.svelte';
  import CourseSectionNav from '../course-section-nav.svelte';
  import CourseInstructor from '../course-instructor.svelte';
  import CourseReviews from '../course-reviews.svelte';
  import CoursePricing from '../course-pricing.svelte';
  import LandingThemeScope from '../landing-theme-scope.svelte';
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

<LandingThemeScope theme="saas" class="ui:font-sans">
  <main>
    <SaasHero hero={heroProps}>
      {#snippet navigation()}
        <SaasNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </SaasHero>

    <CourseSectionNav variant="saas" items={sectionNavItems} {labels} />
    <CourseSocialProof variant="saas" {socialProof} {labels} />
    <CourseInfoBlocks variant="saas" {info} {labels} />
    <CourseCurriculum variant="saas" {curriculum} {labels} />
    {#if chips}
      <CourseChips variant="saas" {chips} {labels} />
    {/if}
    <CourseInstructor variant="saas" {instructor} {labels} />
    <CourseReviews variant="saas" {reviews} {labels} />
    <CoursePricing variant="saas" {pricing} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="saas" />
</LandingThemeScope>
