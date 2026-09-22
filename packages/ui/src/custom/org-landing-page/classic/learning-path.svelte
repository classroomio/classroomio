<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import ClassicNav from './nav.svelte';
  import ClassicHero from './hero.svelte';
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

<LandingThemeScope theme="classic" class="ui:bg-[var(--landing-bg-section)] ui:font-sans">
  <ClassicNav {orgName} {logoUrl} {navItems} {authAction} />

  <main>
    <ClassicHero {hero} />

    <LearningPathSeries variant="classic" {series} {labels} />
    <LearningPathCertificate variant="classic" {certificate} {hasCertificate} {labels} />
    <LearningPathInstructors variant="classic" {instructors} {labels} />
    <LearningPathReviews variant="classic" {reviews} {labels} />
    <LearningPathFaq variant="classic" {faq} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="classic" />
</LandingThemeScope>
