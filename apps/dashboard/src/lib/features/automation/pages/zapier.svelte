<script lang="ts">
  import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import * as Alert from '@cio/ui/base/alert';
  import { Button } from '@cio/ui/base/button';
  import * as Card from '@cio/ui/base/card';
  import * as Field from '@cio/ui/base/field';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { Empty } from '@cio/ui/custom/empty';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';

  import { zapierApi } from '$features/automation/api/zapier.svelte';
  import ZapierConnectionList from '$features/automation/components/zapier-connection-list.svelte';
  import ZapierInviteNote from '$features/automation/components/zapier-invite-note.svelte';
  import ZapierRecipeRow from '$features/automation/components/zapier-recipe-row.svelte';
  import ZapierRemoveDialog from '$features/automation/components/zapier-remove-dialog.svelte';
  import ZapierZapsEmpty from '$features/automation/components/zapier-zaps-empty.svelte';
  import type { ZapierConnection } from '$features/automation/utils/types';
  import {
    dismissZapierInviteNote,
    getZapierFailingTriggers,
    getZapierFeaturedRecipes,
    hasAcceptedZapierInvite,
    hasDismissedZapierInviteNote,
    isZapierInviteRequired
  } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgPath, hasPublicApiAccess, isOrgAdmin } from '$lib/utils/store/org';
  import { openUpgradeModal } from '$lib/utils/store/upgrade-modal';
  import { profile } from '$lib/utils/store/user';

  const T = 'automation.zapier';
  const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';
  const featuredRecipes = getZapierFeaturedRecipes();

  let loadedScope = '';
  let disconnectingConnection = $state<ZapierConnection | null>(null);
  let isResending = $state(false);
  let isInviteNoteDismissed = $state(false);

  const overview = $derived(zapierApi.overview);
  const connections = $derived(overview?.connections ?? []);
  const isConnected = $derived(connections.length > 0);
  const isPausedByPlan = $derived(isConnected && !$hasPublicApiAccess);
  const hasLoadError = $derived(Boolean(zapierApi.error) && !overview);
  const failingTriggers = $derived(getZapierFailingTriggers(connections));
  const showInviteNote = $derived(
    isZapierInviteRequired() && !isInviteNoteDismissed && !hasAcceptedZapierInvite(connections, $profile.id)
  );

  $effect(() => {
    const organizationId = $currentOrg.id;
    const isAdmin = Boolean($isOrgAdmin);

    if (!organizationId) return;

    const scope = `${organizationId}:${isAdmin}`;
    if (scope === loadedScope) return;

    if (loadedScope) resetOrganizationView();
    loadedScope = scope;
    isInviteNoteDismissed = hasDismissedZapierInviteNote(organizationId);

    if (!isAdmin) return;

    void zapierApi.loadOnce();
  });

  function resetOrganizationView() {
    disconnectingConnection = null;
    zapierApi.resetOrganizationState();
  }

  function dismissInviteNote() {
    dismissZapierInviteNote($currentOrg.id);
    isInviteNoteDismissed = true;
  }

  async function confirmDisconnect(connection: ZapierConnection) {
    await zapierApi.removeConnection(connection.consentId);
    disconnectingConnection = null;
  }

  async function resendFailedEvents() {
    isResending = true;
    try {
      await zapierApi.redeliverFailed(failingTriggers.map((trigger) => trigger.id));
    } finally {
      isResending = false;
    }
  }
</script>

{#snippet popularZaps(showExploreLink: boolean)}
  <Field.Set class="gap-3">
    <div class="flex items-center justify-between gap-2">
      <Field.Legend class="mb-0">{$t(`${T}.popular_zaps`)}</Field.Legend>
      {#if showExploreLink}
        <Button
          variant="link"
          size="sm"
          href={`${$currentOrgPath}/automation/zapier/apps`}
          class="px-0"
          testId="zapier-explore-apps-link"
        >
          {$t(`${T}.explore_apps`)}
          <ArrowRightIcon size={14} />
        </Button>
      {/if}
    </div>
    <Card.Root class="ui:divide-border gap-0 divide-y px-4 py-0">
      {#each featuredRecipes as featured (featured.recipe.id)}
        <ZapierRecipeRow app={featured.app} recipe={featured.recipe} />
      {/each}
    </Card.Root>
  </Field.Set>
{/snippet}

<Field.Group class="w-full gap-8">
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
  {:else if !isConnected && !$hasPublicApiAccess}
    <Empty title={$t(`${T}.upgrade.title`)} description={$t(`${T}.upgrade.description`)} icon={ZapIcon} variant="page">
      <Button onclick={openUpgradeModal} testId="zapier-upgrade">{$t(`${T}.upgrade.cta`)}</Button>
    </Empty>
  {:else if !isConnected}
    {#if showInviteNote}
      <ZapierInviteNote onDismiss={dismissInviteNote} />
    {/if}
    <ZapierZapsEmpty />
    {@render popularZaps(false)}
  {:else}
    {#if showInviteNote}
      <ZapierInviteNote onDismiss={dismissInviteNote} />
    {/if}
    {#if isPausedByPlan}
      <Alert.Callout variant="warning" title={$t(`${T}.paused.title`)} description={$t(`${T}.paused.description`)} />
    {:else if failingTriggers.length > 0}
      <Alert.Root variant="warning" data-testid="zapier-failed-events">
        <AlertTriangleIcon />
        <Alert.Title>{$t(`${T}.failed_events.title`)}</Alert.Title>
        <Alert.Description>
          <p>{$t(`${T}.failed_events.description`)}</p>
          <Button
            variant="outline"
            size="sm"
            class="mt-2"
            loading={isResending}
            onclick={resendFailedEvents}
            testId="zapier-resend-failed"
          >
            {$t(`${T}.failed_events.resend`)}
          </Button>
        </Alert.Description>
      </Alert.Root>
    {/if}

    <Field.Set class="gap-3">
      <Field.Legend class="mb-0">{$t(`${T}.connection.title`)}</Field.Legend>
      <ZapierConnectionList {connections} onDisconnect={(connection) => (disconnectingConnection = connection)} />
    </Field.Set>

    {@render popularZaps(true)}
  {/if}
</Field.Group>

<ZapierRemoveDialog
  connection={disconnectingConnection}
  isRemoving={zapierApi.isLoading}
  onConfirm={confirmDisconnect}
  onClose={() => (disconnectingConnection = null)}
/>
