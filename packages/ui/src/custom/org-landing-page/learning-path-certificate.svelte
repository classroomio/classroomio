<script lang="ts">
  import type { LearningPathCertificateInfo, LearningPathLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';

  interface Props {
    variant: OrgLandingPageTheme;
    certificate?: LearningPathCertificateInfo | null;
    hasCertificate: boolean;
    labels?: LearningPathLandingPageLabels;
  }

  let { variant, certificate = null, hasCertificate = false, labels }: Props = $props();

  const t = $derived(courseLandingTokens(variant));
</script>

{#if hasCertificate && certificate}
  <section id="certificate" class="ui:border-y ui:border-[var(--landing-border)] ui:bg-[var(--landing-card)]">
    <div class={t.sectionInner}>
      <div class={t.sectionHeader}>
        {#if labels?.certificateEyebrow}
          <span class={t.eyebrow}>{labels.certificateEyebrow}</span>
        {/if}
        <h2 class={t.heading}>{labels?.certificateHeading ?? 'Get certified'}</h2>
        <span class={t.headingRule} aria-hidden="true"></span>
      </div>

      {#if certificate.description}
        <p class="ui:mb-4 ui:max-w-2xl ui:text-base ui:text-[var(--landing-fg-muted)]">{certificate.description}</p>
      {/if}

      <dl class="ui:flex ui:flex-wrap ui:gap-x-10 ui:gap-y-2 ui:text-sm ui:text-[var(--landing-fg-muted)]">
        {#if certificate.issuer}
          <div>
            <dt class="ui:font-medium ui:text-[var(--landing-fg)]">
              {labels?.certificateIssuerHeading ?? 'Issued by'}
            </dt>
            <dd>{certificate.issuer}</dd>
          </div>
        {/if}

        {#if certificate.validity}
          <div>
            <dt class="ui:font-medium ui:text-[var(--landing-fg)]">
              {labels?.certificateValidityHeading ?? 'Validity'}
            </dt>
            <dd>{certificate.validity}</dd>
          </div>
        {/if}
      </dl>
    </div>
  </section>
{/if}
