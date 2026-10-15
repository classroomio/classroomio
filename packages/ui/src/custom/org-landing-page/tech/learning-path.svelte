<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import TechNav from './nav.svelte';
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

<LandingThemeScope theme="tech" class="ui:font-mono">
  <main>
    <LearningPathHero variant="tech" {orgName} {hero} {labels}>
      {#snippet navigation()}
        <TechNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </LearningPathHero>

    <CourseSectionNav variant="tech" items={sectionNavItems} {labels} />
    <LearningPathAbout variant="tech" {about} {labels} />
    <LearningPathSeries variant="tech" {series} {labels} />
    <LearningPathCertificate variant="tech" {certificate} {hasCertificate} {labels} />
    <LearningPathInstructors variant="tech" {instructors} {labels} />
    <LearningPathReviews variant="tech" {reviews} {labels} />
    <LearningPathFaq variant="tech" {faq} {labels} />
    <LearningPathPricing variant="tech" {pricing} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="tech" />
</LandingThemeScope>
