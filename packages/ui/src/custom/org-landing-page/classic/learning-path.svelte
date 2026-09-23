<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import ClassicNav from './nav.svelte';
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

<LandingThemeScope theme="classic" class="ui:bg-[var(--landing-bg-section)] ui:font-sans">
  <ClassicNav {orgName} {logoUrl} {navItems} {authAction} />

  <main>
    <LearningPathHero variant="classic" {orgName} {hero} {labels} />
    <CourseSectionNav variant="classic" items={sectionNavItems} {labels} />
    <LearningPathAbout variant="classic" {about} {labels} />
    <LearningPathSeries variant="classic" {series} {labels} />
    <LearningPathCertificate variant="classic" {certificate} {hasCertificate} {labels} />
    <LearningPathInstructors variant="classic" {instructors} {labels} />
    <LearningPathReviews variant="classic" {reviews} {labels} />
    <LearningPathFaq variant="classic" {faq} {labels} />
    <LearningPathPricing variant="classic" {pricing} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="classic" />
</LandingThemeScope>
