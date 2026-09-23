<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import QuartzNav from './nav.svelte';
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

<LandingThemeScope theme="quartz" class="ui:font-sans">
  <QuartzNav {orgName} {logoUrl} {navItems} {authAction} />

  <main>
    <LearningPathHero variant="quartz" {orgName} {hero} {labels} />
    <CourseSectionNav variant="quartz" items={sectionNavItems} {labels} />
    <LearningPathAbout variant="quartz" {about} {labels} />
    <LearningPathSeries variant="quartz" {series} {labels} />
    <LearningPathCertificate variant="quartz" {certificate} {hasCertificate} {labels} />
    <LearningPathInstructors variant="quartz" {instructors} {labels} />
    <LearningPathReviews variant="quartz" {reviews} {labels} />
    <LearningPathFaq variant="quartz" {faq} {labels} />
    <LearningPathPricing variant="quartz" {pricing} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="quartz" />
</LandingThemeScope>
