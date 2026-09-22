<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import TerminalNav from './nav.svelte';
  import TerminalHero from './hero.svelte';
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

<LandingThemeScope theme="terminal" class="ui:font-sans">
  <main>
    <TerminalHero {orgName} {hero} courses={[]}>
      {#snippet navigation()}
        <TerminalNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </TerminalHero>

    <LearningPathSeries variant="terminal" {series} {labels} />
    <LearningPathCertificate variant="terminal" {certificate} {hasCertificate} {labels} />
    <LearningPathInstructors variant="terminal" {instructors} {labels} />
    <LearningPathReviews variant="terminal" {reviews} {labels} />
    <LearningPathFaq variant="terminal" {faq} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="terminal" />
</LandingThemeScope>
