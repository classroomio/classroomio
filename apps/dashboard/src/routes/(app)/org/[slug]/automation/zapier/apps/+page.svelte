<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import * as Page from '@cio/ui/base/page';
  import { BackButton } from '@cio/ui/custom/back-button';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';

  import ZapierOpenButton from '$features/automation/components/zapier-open-button.svelte';
  import { ZapierDirectoryPage } from '$features/automation/pages';
  import { buildZapierZapUrl } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath, hasPublicApiAccess, isOrgAdmin } from '$lib/utils/store/org';

  const T = 'automation.zapier.directory';
  const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';
  const canCreateZap = $derived($isOrgAdmin === true && !isSelfHosted && $hasPublicApiAccess);
</script>

<svelte:head><title>{t.get(`${T}.title`)} - ClassroomIO</title></svelte:head>
<Page.Header>
  <Page.HeaderContent>
    <BackButton href={`${$currentOrgPath}/automation/zapier`} label={$t(`${T}.back`)} class="p-0!" />
    <Page.Title>{$t(`${T}.title`)}</Page.Title>
    <Page.Subtitle>{$t(`${T}.subtitle`)}</Page.Subtitle>
  </Page.HeaderContent>
  {#if canCreateZap}
    <Page.Action>
      <ZapierOpenButton href={buildZapierZapUrl([])} testId="zapier-create-zap">
        {$t(`${T}.create_zap`)}
        <ArrowUpRightIcon size={16} />
      </ZapierOpenButton>
    </Page.Action>
  {/if}
</Page.Header>
<Page.Body>{#snippet child()}<ZapierDirectoryPage />{/snippet}</Page.Body>
