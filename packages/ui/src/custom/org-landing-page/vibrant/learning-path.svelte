<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import VibrantNav from './nav.svelte';
  import VibrantHero from './hero.svelte';
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

<LandingThemeScope theme="vibrant" class="ui:font-sans">
  <main>
    <VibrantHero {hero}>
      {#snippet navigation()}
        <VibrantNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </VibrantHero>

    <LearningPathSeries variant="vibrant" {series} {labels} />
    <LearningPathCertificate variant="vibrant" {certificate} {hasCertificate} {labels} />
    <LearningPathInstructors variant="vibrant" {instructors} {labels} />
    <LearningPathReviews variant="vibrant" {reviews} {labels} />
    <LearningPathFaq variant="vibrant" {faq} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="vibrant" />
</LandingThemeScope>
