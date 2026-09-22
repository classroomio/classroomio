<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import BoldNav from './nav.svelte';
  import BoldHero from './hero.svelte';
  import OrgLandingPageFooter from '../landing-page-footer.svelte';
  import LearningPathSeries from '../learning-path-series.svelte';
  import LearningPathCertificate from '../learning-path-certificate.svelte';
  import LearningPathInstructors from '../learning-path-instructors.svelte';
  import LearningPathReviews from '../learning-path-reviews.svelte';
  import LearningPathFaq from '../learning-path-faq.svelte';
  import LandingThemeScope from '../landing-theme-scope.svelte';

  let {
    orgName,
    logoUrl,
    navItems,
    authAction,
    hero,
    series,
    certificate,
    hasCertificate,
    instructors,
    reviews,
    faq,
    footer,
    labels
  }: LearningPathLandingPageProps = $props();
</script>

<LandingThemeScope theme="bold" class="ui:font-sans">
  <BoldNav {orgName} {logoUrl} {navItems} {authAction} />

  <main>
    <BoldHero {hero} />

    <LearningPathSeries variant="bold" {series} {labels} />
    <LearningPathCertificate variant="bold" {certificate} {hasCertificate} {labels} />
    <LearningPathInstructors variant="bold" {instructors} {labels} />
    <LearningPathReviews variant="bold" {reviews} {labels} />
    <LearningPathFaq variant="bold" {faq} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="bold" />
</LandingThemeScope>
