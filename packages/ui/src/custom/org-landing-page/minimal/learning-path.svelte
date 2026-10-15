<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import MinimalNav from './nav.svelte';
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

<LandingThemeScope theme="minimal" class="ui:font-sans">
  <main>
    <LearningPathHero variant="minimal" {orgName} {hero} {labels}>
      {#snippet navigation()}
        <MinimalNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </LearningPathHero>

    <CourseSectionNav variant="minimal" items={sectionNavItems} {labels} />
    <LearningPathAbout variant="minimal" {about} {labels} />
    <LearningPathSeries variant="minimal" {series} {labels} />
    <LearningPathCertificate variant="minimal" {certificate} {hasCertificate} {labels} />
    <LearningPathInstructors variant="minimal" {instructors} {labels} />
    <LearningPathReviews variant="minimal" {reviews} {labels} />
    <LearningPathFaq variant="minimal" {faq} {labels} />
    <LearningPathPricing variant="minimal" {pricing} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="minimal" />
</LandingThemeScope>
