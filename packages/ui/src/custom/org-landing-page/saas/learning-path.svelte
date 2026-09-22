<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import SaasNav from './nav.svelte';
  import SaasHero from './hero.svelte';
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

<LandingThemeScope theme="saas" class="ui:font-sans">
  <main>
    <SaasHero {hero}>
      {#snippet navigation()}
        <SaasNav {orgName} {logoUrl} {navItems} {authAction} />
      {/snippet}
    </SaasHero>

    <LearningPathSeries variant="saas" {series} {labels} />
    <LearningPathCertificate variant="saas" {certificate} {hasCertificate} {labels} />
    <LearningPathInstructors variant="saas" {instructors} {labels} />
    <LearningPathReviews variant="saas" {reviews} {labels} />
    <LearningPathFaq variant="saas" {faq} {labels} />
  </main>

  <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant="saas" />
</LandingThemeScope>
