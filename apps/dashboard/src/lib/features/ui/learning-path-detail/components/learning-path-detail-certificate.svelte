<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import type { LearningPathCertificateInfo } from '@cio/ui/custom/org-landing-page';

  interface Props {
    certificate?: LearningPathCertificateInfo | null;
    hasCertificate: boolean;
  }

  let { certificate = null, hasCertificate = false }: Props = $props();
</script>

{#if hasCertificate && certificate}
  <section class="ui:bg-card ui:border-border border-y">
    <div class="mx-auto w-full max-w-4xl px-4 py-12 md:px-6">
      <h2 class="ui:text-foreground mb-2 text-2xl font-semibold">
        {t.get('public_learning_paths.detail.certificate_heading')}
      </h2>

      {#if certificate.description}
        <p class="ui:text-muted-foreground mb-4 max-w-2xl text-base">{certificate.description}</p>
      {/if}

      <dl class="ui:text-muted-foreground flex flex-wrap gap-x-10 gap-y-2 text-sm">
        {#if certificate.issuer}
          <div>
            <dt class="ui:text-foreground font-medium">{t.get('public_learning_paths.detail.certificate_issuer')}</dt>
            <dd>{certificate.issuer}</dd>
          </div>
        {/if}

        {#if certificate.validity}
          <div>
            <dt class="ui:text-foreground font-medium">{t.get('public_learning_paths.detail.certificate_validity')}</dt>
            <dd>{certificate.validity}</dd>
          </div>
        {/if}
      </dl>
    </div>
  </section>
{/if}
