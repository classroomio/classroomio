<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import StudioNav from './nav.svelte';
  import StudioHero from './hero.svelte';
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

<LandingThemeScope theme="studio" class="ui:font-sans">
  <main>
    <StudioHero {hero} courses={[]}>
      {#snippet navigation()}
        <StudioNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </StudioHero>

    <LearningPathSeries variant="studio" {series} {labels} />
    <LearningPathCertificate variant="studio" {certificate} {hasCertificate} {labels} />
    <LearningPathInstructors variant="studio" {instructors} {labels} />
    <LearningPathReviews variant="studio" {reviews} {labels} />
    <LearningPathFaq variant="studio" {faq} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="studio" />
</LandingThemeScope>
