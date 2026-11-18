<script lang="ts">
  import { resolve } from '$app/paths';
  import * as Alert from '@cio/ui/base/alert';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
  import type { TZapierPartnerApp } from '@cio/utils/constants/zapier';

  import { zapierApi } from '$features/automation/api/zapier.svelte';
  import ZapierAppStrip from '$features/automation/components/zapier-app-strip.svelte';
  import ZapierRecipeList from '$features/automation/components/zapier-recipe-list.svelte';
  import { getZapierAccess, getZapierSimilarApps } from '$features/automation/utils/zapier-utils';
  import { UpgradeBanner } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgPath, hasPublicApiAccess, isOrgAdmin } from '$lib/utils/store/org';

  interface Props {
    app: TZapierPartnerApp;
  }

  let { app }: Props = $props();

  const T = 'automation.zapier';
  const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';

  const connection = $derived(zapierApi.overview?.connections[0] ?? null);
  const relatedApps = $derived(getZapierSimilarApps(app));

  let loadedScope = '';

  $effect(() => {
    const organizationId = $currentOrg.id;
    const isAdmin = $isOrgAdmin === true;

    if (!organizationId) return;

    const scope = `${organizationId}:${isAdmin}`;
    if (scope === loadedScope) return;

    if (loadedScope) zapierApi.resetOrganizationState();
    loadedScope = scope;

    if (!isAdmin) return;

    void zapierApi.loadOnce();
  });
</script>

{#if $isOrgAdmin === false}
  <Alert.Callout
    variant="information"
    title={$t('automation.permissions.disabled_title')}
    description={$t(`${T}.permissions_description`)}
  />
{:else if $isOrgAdmin === null}
  <div class="space-y-2">
    {#each [0, 1, 2] as index (index)}
      <Skeleton class="h-12 w-full" />
    {/each}
  </div>
{:else if isSelfHosted}
  <Alert.Callout
    variant="information"
    title={$t(`${T}.selfhosted.title`)}
    description={$t(`${T}.selfhosted.description`)}
  />
{:else}
  <div class="flex w-full flex-col gap-8" data-testid="zapier-app-page">
    {#if !$hasPublicApiAccess}
      <UpgradeBanner visible>{$t('upgrade.zapier_required')}</UpgradeBanner>
    {:else if connection}
      <p class="ui:text-muted-foreground flex items-center gap-2 text-sm" data-testid="zapier-app-connected">
        <span class="size-2 shrink-0 rounded-full bg-green-500" aria-hidden="true"></span>
        {$t(`${T}.app_page.connected`, {
          organization: $currentOrg.name,
          access: $t(`${T}.connection.access_${getZapierAccess(connection.scopes)}`)
        })}
        <a
          href={resolve(`${$currentOrgPath}/automation/zapier`, {})}
          class="ui:text-primary font-medium hover:underline"
        >
          {$t(`${T}.app_page.manage`)}
        </a>
      </p>
    {/if}

    <ZapierRecipeList {app} />

    <ZapierAppStrip title={$t(`${T}.app_page.related_apps`)} apps={relatedApps} />
  </div>
{/if}
