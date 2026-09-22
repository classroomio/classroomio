<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import CorporateNav from './nav.svelte';
  import CorporateHero from './hero.svelte';
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

<LandingThemeScope theme="corporate" class="ui:font-sans">
  <main>
    <CorporateHero {orgName} {hero}>
      {#snippet navigation()}
        <CorporateNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </CorporateHero>

    <LearningPathSeries variant="corporate" {series} {labels} />
    <LearningPathCertificate variant="corporate" {certificate} {hasCertificate} {labels} />
    <LearningPathInstructors variant="corporate" {instructors} {labels} />
    <LearningPathReviews variant="corporate" {reviews} {labels} />
    <LearningPathFaq variant="corporate" {faq} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="corporate" />
</LandingThemeScope>
