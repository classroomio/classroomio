<script lang="ts">
  import type { LearningPathLandingPageProps } from '../types';
  import QuartzNav from './nav.svelte';
  import QuartzHero from './hero.svelte';
  import QuartzFooter from './footer.svelte';
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

<LandingThemeScope theme="quartz" class="ui:font-sans">
  <QuartzNav {orgName} {logoUrl} {navItems} {authAction} />

  <main class="ui:@container ui:max-w-[1200px] ui:mx-auto ui:border-x ui:border-[var(--landing-border)]">
    <QuartzHero {hero} imageFit="natural" compact align="center" />

    <div class="ui:bg-[var(--landing-card)]">
      <div class="ui:grid ui:grid-cols-1 ui:@4xl:grid-cols-[minmax(0,1fr)]">
        <div class="ui:min-w-0">
          <LearningPathSeries variant="quartz" {series} {labels} />
          <LearningPathCertificate variant="quartz" {certificate} {hasCertificate} {labels} />
          <LearningPathInstructors variant="quartz" {instructors} {labels} />
          <LearningPathReviews variant="quartz" {reviews} {labels} />
          <LearningPathFaq variant="quartz" {faq} {labels} />
        </div>
      </div>
    </div>
  </main>

  <QuartzFooter {orgName} {logoUrl} {footer} />
</LandingThemeScope>
