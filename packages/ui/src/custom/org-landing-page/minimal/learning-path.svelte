<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import MinimalNav from './nav.svelte';
  import MinimalHero from './hero.svelte';
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

<LandingThemeScope theme="minimal" class="ui:font-sans">
  <main>
    <MinimalHero {hero}>
      {#snippet navigation()}
        <MinimalNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </MinimalHero>

    <LearningPathSeries variant="minimal" {series} {labels} />
    <LearningPathCertificate variant="minimal" {certificate} {hasCertificate} {labels} />
    <LearningPathInstructors variant="minimal" {instructors} {labels} />
    <LearningPathReviews variant="minimal" {reviews} {labels} />
    <LearningPathFaq variant="minimal" {faq} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="minimal" />
</LandingThemeScope>
