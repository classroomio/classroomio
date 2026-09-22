<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import TechNav from './nav.svelte';
  import TechHero from './hero.svelte';
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

<LandingThemeScope theme="tech" class="ui:font-sans">
  <main>
    <TechHero {hero}>
      {#snippet navigation()}
        <TechNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </TechHero>

    <LearningPathSeries variant="tech" {series} {labels} />
    <LearningPathCertificate variant="tech" {certificate} {hasCertificate} {labels} />
    <LearningPathInstructors variant="tech" {instructors} {labels} />
    <LearningPathReviews variant="tech" {reviews} {labels} />
    <LearningPathFaq variant="tech" {faq} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="tech" />
</LandingThemeScope>
