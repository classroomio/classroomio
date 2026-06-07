<script lang="ts">
  import type { CourseLandingPageProps } from '../types';
  import VibrantNav from './nav.svelte';
  import VibrantHero from './hero.svelte';
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
  style={themeStyle('vibrant')}
>
  <main>
    <VibrantHero hero={heroProps}>
      {#snippet navigation()}
        <VibrantNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </VibrantHero>

    <CourseSectionNav variant="vibrant" items={sectionNavItems} {labels} />
    <CourseSocialProof variant="vibrant" {socialProof} {labels} />
    <CourseInfoBlocks variant="vibrant" {info} {labels} />
    <CourseCurriculum variant="vibrant" {curriculum} {labels} />
    {#if chips}
      <CourseChips variant="vibrant" {chips} {labels} />
    {/if}
    <CourseInstructor variant="vibrant" {instructor} {labels} />
    <CourseReviews variant="vibrant" {reviews} {labels} />
    <CoursePricing variant="vibrant" {pricing} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="vibrant" />
</div>
