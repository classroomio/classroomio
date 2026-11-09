<script lang="ts">
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import * as Alert from '@cio/ui/base/alert';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { Empty } from '@cio/ui/custom/empty';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';

  import { zapierApi } from '$features/automation/api/zapier.svelte';
  import ZapierActiveTriggers from '$features/automation/components/zapier-active-triggers.svelte';
  import ZapierComingSoon from '$features/automation/components/zapier-coming-soon.svelte';
  import ZapierConnectionsTable from '$features/automation/components/zapier-connections-table.svelte';
  import ZapierRemoveDialog from '$features/automation/components/zapier-remove-dialog.svelte';
  import ZapierTriggersSheet from '$features/automation/components/zapier-triggers-sheet.svelte';
  import ZapierZapsEmpty from '$features/automation/components/zapier-zaps-empty.svelte';
  import type { ZapierConnection, ZapierTrigger } from '$features/automation/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, hasPublicApiAccess, isOrgAdmin } from '$lib/utils/store/org';
  import { openUpgradeModal } from '$lib/utils/store/upgrade-modal';

  const T = 'automation.zapier';
  const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';

  let loadedScope = '';
  let triggersConnection = $state<ZapierConnection | null>(null);
  let removingConnection = $state<ZapierConnection | null>(null);
  let redeliveringTriggerId = $state<string | null>(null);

  const overview = $derived(zapierApi.overview);
  const connections = $derived(overview?.connections ?? []);
  const isConnected = $derived(connections.length > 0);
  const isPausedByPlan = $derived(isConnected && !$hasPublicApiAccess);
  const hasLoadError = $derived(Boolean(zapierApi.error) && !overview);

  $effect(() => {
    const organizationId = $currentOrg.id;
    const isAdmin = Boolean($isOrgAdmin);

    if (!organizationId) return;

    const scope = `${organizationId}:${isAdmin}`;
    if (scope === loadedScope) return;

    if (loadedScope) resetOrganizationView();
    loadedScope = scope;

    if (!isAdmin) return;

    void zapierApi.loadOnce();
  });

  function resetOrganizationView() {
    triggersConnection = null;
    removingConnection = null;
    zapierApi.resetOrganizationState();
  }

  async function confirmRemove(connection: ZapierConnection) {
    await zapierApi.removeConnection(connection.consentId);
    removingConnection = null;
  }

  async function handleRedeliver(trigger: ZapierTrigger) {
    redeliveringTriggerId = trigger.id;
    await zapierApi.redeliverFailed(trigger.id);
    redeliveringTriggerId = null;
  }
</script>

<Field.Group class="mx-auto w-full space-y-6">
  {#if $isOrgAdmin === false}
    <Alert.Callout
      variant="information"
      title={$t('automation.permissions.disabled_title')}
      description={$t(`${T}.permissions_description`)}
      class="w-full"
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
      class="w-full"
    />
  {:else if hasLoadError}
    <Empty
      title={$t(`${T}.error.title`)}
      description={$t(`${T}.error.description`)}
      icon={CircleAlertIcon}
      variant="page"
    >
      <Button onclick={() => zapierApi.load()} loading={zapierApi.isLoading} testId="zapier-retry">
        {$t(`${T}.error.retry`)}
      </Button>
    </Empty>
  {:else if !overview}
    <div class="space-y-2">
      {#each [0, 1, 2] as index (index)}
        <Skeleton class="h-12 w-full" />
      {/each}
    </div>
  {:else if !isConnected}
    {#if !$hasPublicApiAccess}
      <Empty
        title={$t(`${T}.upgrade.title`)}
        description={$t(`${T}.upgrade.description`)}
        icon={ZapIcon}
        variant="page"
      >
        <Button onclick={openUpgradeModal} testId="zapier-upgrade">{$t(`${T}.upgrade.cta`)}</Button>
      </Empty>
    {:else}
      <ZapierZapsEmpty />

      <Field.Set class="gap-3">
        <Field.Legend>{$t(`${T}.setup.title`)}</Field.Legend>
        <ol class="ui:text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
          <li>{$t(`${T}.setup.step_1`)}</li>
          <li>{$t(`${T}.setup.step_2`)}</li>
          <li>{$t(`${T}.setup.step_3`)}</li>
          <li>{$t(`${T}.setup.step_4`)}</li>
        </ol>
      </Field.Set>
    {/if}
  {:else}
    {#if isPausedByPlan}
      <Alert.Callout
        variant="warning"
        title={$t(`${T}.paused.title`)}
        description={$t(`${T}.paused.description`)}
        class="w-full"
      />
    {:else}
      <Alert.Callout
        variant="information"
        title={$t(`${T}.status.connected_title`)}
        description={$t(`${T}.status.connected_description`, {
          used: overview.limits.activeTriggerSubscriptions,
          max: overview.limits.maxTriggerSubscriptions
        })}
        class="w-full"
      />
    {/if}

    <Field.Set class="gap-3">
      <Field.Legend>{$t(`${T}.connected_apps.title`)}</Field.Legend>
      <ZapierComingSoon
        titleKey={`${T}.connected_apps.coming_soon_title`}
        descriptionKey={`${T}.connected_apps.coming_soon_description`}
      />
      <div class="space-y-2 pt-2">
        <h3 class="text-sm font-medium">{$t(`${T}.active_triggers.title`)}</h3>
        <ZapierActiveTriggers
          {connections}
          onViewConnection={(connection) => (triggersConnection = connection)}
          onRedeliver={handleRedeliver}
          redeliveringId={redeliveringTriggerId}
        />
      </div>
    </Field.Set>

    <Field.Set id="zapier-access" class="gap-3">
      <Field.Legend>{$t(`${T}.access_section.title`)}</Field.Legend>
      <Field.Description>{$t(`${T}.connections.description`)}</Field.Description>
      <ZapierConnectionsTable
        {connections}
        canManage={Boolean($isOrgAdmin)}
        onViewTriggers={(connection) => (triggersConnection = connection)}
        onRemove={(connection) => (removingConnection = connection)}
      />
    </Field.Set>
  {/if}
</Field.Group>

<ZapierTriggersSheet connection={triggersConnection} onClose={() => (triggersConnection = null)} />
<ZapierRemoveDialog
  connection={removingConnection}
  isRemoving={zapierApi.isLoading}
  onConfirm={confirmRemove}
  onClose={() => (removingConnection = null)}
/>
