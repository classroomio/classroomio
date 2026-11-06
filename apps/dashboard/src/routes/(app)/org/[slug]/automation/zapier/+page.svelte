<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';

  import { zapierApi } from '$features/automation/api/zapier.svelte';
  import ZapierOpenButton from '$features/automation/components/zapier-open-button.svelte';
  import { ZapierAutomationPage } from '$features/automation/pages';
  import { ZAPIER_HELP_URL } from '$features/automation/utils/automation-utils';
  import { buildZapierZapUrl } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';
  import { hasPublicApiAccess, isOrgAdmin } from '$lib/utils/store/org';

  const T = 'automation.zapier';
  const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';
  const isConnected = $derived((zapierApi.overview?.connections.length ?? 0) > 0);
  const canCreateZap = $derived($isOrgAdmin === true && !isSelfHosted && $hasPublicApiAccess);
  const createLabel = $derived(isConnected ? $t(`${T}.create_more_zaps`) : $t(`${T}.create_zap`));
</script>

<svelte:head><title>{t.get(`${T}.page_title`)} - ClassroomIO</title></svelte:head>
<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t(`${T}.page_title`)}</Page.Title>
    <Page.Subtitle>{$t(`${T}.page_subtitle`)}</Page.Subtitle>
  </Page.HeaderContent>
  <Page.Action>
    {#if canCreateZap}
      <ZapierOpenButton href={buildZapierZapUrl([])} testId="zapier-create-zap">
        {createLabel}
        <ArrowUpRightIcon size={16} />
      </ZapierOpenButton>
    {/if}
    <Button
      variant="secondary"
      href={ZAPIER_HELP_URL}
      target="_blank"
      rel="noopener noreferrer"
      testId="automation-zapier-read-docs"
    >
      <ArrowUpRightIcon size={16} />
      {$t('automation.read_docs')}
    </Button>
  </Page.Action>
</Page.Header>
<Page.Body>{#snippet child()}<ZapierAutomationPage />{/snippet}</Page.Body>
