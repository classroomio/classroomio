<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';
  import { BackButton } from '@cio/ui/custom/back-button';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';

  import ZapierAppMark from '$features/automation/components/zapier-app-mark.svelte';
  import ZapierMark from '$features/automation/components/zapier-mark.svelte';
  import ZapierOpenButton from '$features/automation/components/zapier-open-button.svelte';
  import { ZapierAppPage } from '$features/automation/pages';
  import {
    buildZapierRecipeUrl,
    CLASSROOMIO_LOGO_URL,
    getZapierPrimaryRecipe,
    ZAPIER_URLS
  } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath, hasPublicApiAccess, isOrgAdmin } from '$lib/utils/store/org';

  let { data } = $props();

  const T = 'automation.zapier';
  const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';
  const canCreateZap = $derived($isOrgAdmin === true && !isSelfHosted && $hasPublicApiAccess);
  const primaryRecipe = $derived(getZapierPrimaryRecipe(data.app));
  const createZapUrl = $derived(primaryRecipe ? buildZapierRecipeUrl(data.app, primaryRecipe) : ZAPIER_URLS.editor);
  const appTitle = $derived($t(`${T}.app_sheet.title`, { app: data.app.name }));
</script>

<svelte:head><title>{t.get(`${T}.app_sheet.title`, { app: data.app.name })} - ClassroomIO</title></svelte:head>
<Page.Header>
  <Page.HeaderContent>
    <BackButton href={`${$currentOrgPath}/automation/zapier/apps`} label={$t(`${T}.directory.title`)} class="p-0!" />
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="flex shrink-0 items-center gap-1.5">
        <ZapierMark src={CLASSROOMIO_LOGO_URL} name="ClassroomIO" />
        <ZapierAppMark app={data.app} />
      </div>
      <div class="min-w-0">
        <Page.Title>{appTitle}</Page.Title>
        <Page.Subtitle>{$t(`${T}.apps.${data.app.slug}.description`)}</Page.Subtitle>
      </div>
    </div>
  </Page.HeaderContent>
  {#if canCreateZap}
    <Page.Action>
      <Button
        variant="secondary"
        href={ZAPIER_URLS.myZaps}
        target="_blank"
        rel="noopener noreferrer"
        testId="zapier-app-my-zaps"
      >
        {$t(`${T}.my_zaps`)}
        <ArrowUpRightIcon size={16} />
      </Button>
      <ZapierOpenButton href={createZapUrl} testId="zapier-app-create-zap">
        {$t(`${T}.app_sheet.create_zap`, { app: data.app.name })}
        <ArrowUpRightIcon size={16} />
      </ZapierOpenButton>
    </Page.Action>
  {/if}
</Page.Header>
<Page.Body>{#snippet child()}<ZapierAppPage app={data.app} />{/snippet}</Page.Body>
