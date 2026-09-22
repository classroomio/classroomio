<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import EditorialNav from './nav.svelte';
  import EditorialHero from './hero.svelte';
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

<LandingThemeScope theme="editorial" class="ui:font-sans">
  <main>
    <EditorialHero {hero} courses={[]}>
      {#snippet navigation()}
        <EditorialNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </EditorialHero>

    <LearningPathSeries variant="editorial" {series} {labels} />
    <LearningPathCertificate variant="editorial" {certificate} {hasCertificate} {labels} />
    <LearningPathInstructors variant="editorial" {instructors} {labels} />
    <LearningPathReviews variant="editorial" {reviews} {labels} />
    <LearningPathFaq variant="editorial" {faq} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="editorial" />
</LandingThemeScope>
