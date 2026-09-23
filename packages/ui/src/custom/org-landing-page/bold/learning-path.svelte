<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import BoldNav from './nav.svelte';
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

<LandingThemeScope theme="bold" class="ui:bg-[var(--landing-bg-section)] ui:font-sans">
  <BoldNav {orgName} {logoUrl} {navItems} {authAction} />

  <main>
    <LearningPathHero variant="bold" {orgName} {hero} {labels} />
    <CourseSectionNav variant="bold" items={sectionNavItems} {labels} />
    <LearningPathAbout variant="bold" {about} {labels} />
    <LearningPathSeries variant="bold" {series} {labels} />
    <LearningPathCertificate variant="bold" {certificate} {hasCertificate} {labels} />
    <LearningPathInstructors variant="bold" {instructors} {labels} />
    <LearningPathReviews variant="bold" {reviews} {labels} />
    <LearningPathFaq variant="bold" {faq} {labels} />
    <LearningPathPricing variant="bold" {pricing} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="bold" />
</LandingThemeScope>
