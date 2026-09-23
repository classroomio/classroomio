<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import EditorialNav from './nav.svelte';
  import LearningPathHero from '../learning-path-hero.svelte';
  import LearningPathAbout from '../learning-path-about.svelte';
  import LearningPathSeries from '../learning-path-series.svelte';
  import LearningPathCertificate from '../learning-path-certificate.svelte';
  import LearningPathInstructors from '../learning-path-instructors.svelte';
  import LearningPathReviews from '../learning-path-reviews.svelte';
  import LearningPathFaq from '../learning-path-faq.svelte';
  import LearningPathPricing from '../learning-path-pricing.svelte';
  import OrgLandingPageFooter from '../landing-page-footer.svelte';
  import LandingThemeScope from '../landing-theme-scope.svelte';
  import CourseSectionNav from '../course-section-nav.svelte';
  import { buildLearningPathSectionNavItems } from '../learning-path-detail.helpers';

  let {
    orgName,
    logoUrl,
    navItems,
    authAction,
    hero,
    about,
    series,
    certificate,
    hasCertificate,
    instructors,
    reviews,
    faq,
    pricing,
    footer,
    labels
  }: LearningPathLandingPageProps = $props();

  const sectionNavItems = $derived(
    buildLearningPathSectionNavItems({ about, series, hasCertificate, instructors, reviews, faq, pricing }, labels)
  );
</script>

<LandingThemeScope theme="editorial" class="ui:font-serif">
  <main>
    <LearningPathHero variant="editorial" {orgName} {hero} {labels}>
      {#snippet navigation()}
        <EditorialNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </LearningPathHero>

    <CourseSectionNav variant="editorial" items={sectionNavItems} {labels} />
    <LearningPathAbout variant="editorial" {about} {labels} />
    <LearningPathSeries variant="editorial" {series} {labels} />
    <LearningPathCertificate variant="editorial" {certificate} {hasCertificate} {labels} />
    <LearningPathInstructors variant="editorial" {instructors} {labels} />
    <LearningPathReviews variant="editorial" {reviews} {labels} />
    <LearningPathFaq variant="editorial" {faq} {labels} />
    <LearningPathPricing variant="editorial" {pricing} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="editorial" />
</LandingThemeScope>
