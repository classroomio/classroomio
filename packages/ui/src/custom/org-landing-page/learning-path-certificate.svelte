<script lang="ts">
  import type { LearningPathCertificateInfo, LearningPathLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
  import AwardIcon from '@lucide/svelte/icons/award';

  interface Props {
    variant: OrgLandingPageTheme;
    certificate?: LearningPathCertificateInfo | null;
    hasCertificate: boolean;
    labels?: LearningPathLandingPageLabels;
  }

  let { variant, certificate = null, hasCertificate = false, labels }: Props = $props();

  const t = $derived(courseLandingTokens(variant));

  const defaultDescription =
    'Complete all courses — every lesson and exercise — and receive the verified path certificate, ready to add to LinkedIn and your CV.';
</script>

{#if hasCertificate}
  <section id="certificate" class={t.sectionShell}>
    <div class="ui:max-w-[800px] ui:mx-auto">
      <div
        class="ui:bg-[var(--landing-card)] ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)] ui:[box-shadow:var(--landing-shadow-card)] ui:p-6 ui:sm:p-8 ui:flex ui:flex-col ui:sm:flex-row ui:items-start ui:gap-6"
      >
        <div
          class="ui:size-14 ui:sm:size-16 ui:rounded-2xl ui:bg-[var(--landing-accent)]/15 ui:text-[var(--landing-accent)] ui:flex ui:items-center ui:justify-center ui:shrink-0"
        >
          <AwardIcon class="ui:size-8" />
        </div>

        <div class="ui:flex-1">
          {#if labels?.certificateEyebrow}
            <span class={t.eyebrow}>{labels.certificateEyebrow}</span>
          {/if}
          <h3
            class="ui:text-xl ui:sm:text-2xl ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)] ui:mb-2"
          >
            {labels?.certificateHeading ?? 'Earn a shareable certificate'}
          </h3>
          <p class="ui:text-sm ui:sm:text-base ui:text-[var(--landing-fg-muted)] ui:leading-relaxed">
            {certificate?.description ?? defaultDescription}
          </p>

          {#if certificate?.issuer || certificate?.validity}
            <dl
              class="ui:flex ui:flex-wrap ui:gap-x-8 ui:gap-y-2 ui:text-xs ui:sm:text-sm ui:text-[var(--landing-fg-muted)] ui:mt-4 ui:pt-4 ui:border-t ui:border-[var(--landing-border)]/60"
            >
              {#if certificate.issuer}
                <div>
                  <dt class="ui:font-medium ui:text-[var(--landing-fg)]">
                    {labels?.certificateIssuerHeading ?? 'Issued by'}
                  </dt>
                  <dd class="ui:mt-0.5">{certificate.issuer}</dd>
                </div>
              {/if}

              {#if certificate.validity}
                <div>
                  <dt class="ui:font-medium ui:text-[var(--landing-fg)]">
                    {labels?.certificateValidityHeading ?? 'Validity'}
                  </dt>
                  <dd class="ui:mt-0.5">{certificate.validity}</dd>
                </div>
              {/if}
            </dl>
          {/if}
        </div>
      </div>
    </div>
  </section>
{/if}
