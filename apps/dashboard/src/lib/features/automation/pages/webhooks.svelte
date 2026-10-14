<script lang="ts">
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import WebhookIcon from '@lucide/svelte/icons/webhook';
  import * as Alert from '@cio/ui/base/alert';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as HoverCard from '@cio/ui/base/hover-card';
  import * as Field from '@cio/ui/base/field';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { Switch } from '@cio/ui/base/switch';
  import * as Table from '@cio/ui/base/table';
  import * as Code from '@cio/ui/custom/code';
  import { Empty } from '@cio/ui/custom/empty';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';

  import { webhookApi } from '$features/automation/api/webhook.svelte';
  import WebhookDeliveriesSheet from '$features/automation/components/webhook-deliveries-sheet.svelte';
  import WebhookFormSheet from '$features/automation/components/webhook-form-sheet.svelte';
  import type { Webhook } from '$features/automation/utils/types';
  import {
    formatWebhookTimestamp,
    getWebhookErrorRate,
    getWebhookEventsCountKey,
    getWebhookEventsLabelCount,
    getWebhookEventTypes,
    WEBHOOK_HEALTH_BADGE
  } from '$features/automation/utils/webhook-utils';
  import { UpgradeBanner } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, hasPublicApiAccess, isOrgAdmin } from '$lib/utils/store/org';

  const T = 'automation.webhooks';

  let isFormOpen = $state(false);
  let editingWebhook = $state<Webhook | null>(null);
  let deliveriesWebhook = $state<Webhook | null>(null);
  let loadedOrgId = '';

  const webhooks = $derived(webhookApi.webhooks);
  const canManage = $derived($isOrgAdmin && $hasPublicApiAccess);
  const upgradeMessageKey = $derived(
    PUBLIC_IS_SELFHOSTED === 'true' ? 'upgrade.enterprise_required' : 'upgrade.webhooks_required'
  );

  $effect(() => {
    const organizationId = $currentOrg.id;

    if (!organizationId || organizationId === loadedOrgId) return;

    if (loadedOrgId) {
      resetOrganizationView();
    }

    if (!canManage) return;

    loadedOrgId = organizationId;
    void webhookApi.list();
  });

  function resetOrganizationView() {
    isFormOpen = false;
    editingWebhook = null;
    deliveriesWebhook = null;
    webhookApi.resetOrganizationState();
  }

  function openCreate() {
    editingWebhook = null;
    isFormOpen = true;
  }

  function openEdit(webhook: Webhook) {
    editingWebhook = webhook;
    isFormOpen = true;
  }

  function closeForm() {
    isFormOpen = false;
    editingWebhook = null;
  }

  async function handleDelete(webhook: Webhook) {
    if (!confirm(t.get(`${T}.delete_confirm`, { name: webhook.name }))) return;

    await webhookApi.remove(webhook.id);
  }

  async function handleRegenerateSecret(webhook: Webhook) {
    if (!confirm(t.get(`${T}.regenerate_confirm`))) return;

    await webhookApi.regenerateSecret(webhook.id);
  }
</script>

<Field.Group class="mx-auto w-full space-y-2">
  <UpgradeBanner visible={!$hasPublicApiAccess}>{$t(upgradeMessageKey)}</UpgradeBanner>

  {#if !$isOrgAdmin}
    <Alert.Callout
      variant="information"
      title={$t('automation.permissions.disabled_title')}
      description={$t(`${T}.permissions_description`)}
      class="w-full"
    />
  {/if}

  <div class="space-y-3">
    <div class="flex items-start justify-between gap-4">
      <p class="ui:text-muted-foreground text-sm">{$t(`${T}.description`)}</p>
      {#if canManage}
        <IconButton onclick={openCreate} tooltip={$t(`${T}.create`)} testId="webhook-create">
          <PlusIcon size={16} />
        </IconButton>
      {/if}
    </div>

    {#if webhookApi.revealedSecret}
      <div class="rounded-lg border border-amber-200 bg-amber-50 p-4" data-testid="webhook-secret-reveal">
        <div class="flex items-start justify-between gap-2">
          <p class="text-sm font-medium text-amber-800">{$t(`${T}.secret_once`)}</p>
          <Button variant="outline" size="sm" onclick={() => webhookApi.clearRevealedSecret()}>
            {$t(`${T}.secret_dismiss`)}
          </Button>
        </div>
        <div class="mt-3">
          <Code.Root code={webhookApi.revealedSecret} hideLines={true} class="text-xs break-all">
            <Code.CopyButton />
          </Code.Root>
        </div>
      </div>
    {/if}

    {#if canManage}
      {#if !webhooks}
        <div class="space-y-2">
          {#each [0, 1, 2] as index (index)}
            <Skeleton class="h-12 w-full" />
          {/each}
        </div>
      {:else if webhooks.length === 0}
        <Empty
          title={$t(`${T}.empty_title`)}
          description={$t(`${T}.empty_description`)}
          icon={WebhookIcon}
          variant="page"
        >
          <Button onclick={openCreate}>
            <PlusIcon size={16} />
            {$t(`${T}.create`)}
          </Button>
        </Empty>
      {:else}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>{$t(`${T}.table.name`)}</Table.Head>
              <Table.Head>{$t(`${T}.table.events`)}</Table.Head>
              <Table.Head>{$t(`${T}.table.health`)}</Table.Head>
              <Table.Head>{$t(`${T}.table.error_rate`)}</Table.Head>
              <Table.Head>{$t(`${T}.table.active`)}</Table.Head>
              <Table.Head class="w-10"></Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each webhooks as webhook (webhook.id)}
              <Table.Row data-testid={`webhook-row-${webhook.id}`}>
                <Table.Cell>
                  <p class="font-medium">{webhook.name}</p>
                  <p class="ui:text-muted-foreground max-w-xs truncate text-xs">{webhook.payloadUrl}</p>
                </Table.Cell>
                <Table.Cell class="text-sm">
                  <HoverCard.Root openDelay={150}>
                    <HoverCard.Trigger>
                      {#snippet child({ props })}
                        <button {...props} type="button" class="text-left">
                          {#if webhook.eventMode === 'all'}
                            {$t(`${T}.events_all`)}
                          {:else}
                            {$t(getWebhookEventsCountKey(webhook), { count: getWebhookEventsLabelCount(webhook) })}
                          {/if}
                        </button>
                      {/snippet}
                    </HoverCard.Trigger>
                    <HoverCard.Content class="w-auto max-w-sm" data-testid={`webhook-events-${webhook.id}`}>
                      <ul class="space-y-1">
                        {#each getWebhookEventTypes(webhook) as eventType (eventType)}
                          <li class="font-mono text-xs">{eventType}</li>
                        {/each}
                      </ul>
                    </HoverCard.Content>
                  </HoverCard.Root>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant={WEBHOOK_HEALTH_BADGE[webhook.health]}>{$t(`${T}.health.${webhook.health}`)}</Badge>
                  <p class="ui:text-muted-foreground mt-1 text-xs">
                    {webhook.lastDeliveryAt ? formatWebhookTimestamp(webhook.lastDeliveryAt) : $t(`${T}.no_deliveries`)}
                  </p>
                </Table.Cell>
                <Table.Cell class="text-sm">
                  {#if getWebhookErrorRate(webhook) === null}
                    <span class="ui:text-muted-foreground">{$t(`${T}.table.no_recent_deliveries`)}</span>
                  {:else}
                    <p class="font-medium">{getWebhookErrorRate(webhook)}%</p>
                    <p class="ui:text-muted-foreground text-xs">
                      {$t(`${T}.table.error_rate_detail`, {
                        failed: webhook.recentDeliveries.failed,
                        total: webhook.recentDeliveries.total
                      })}
                    </p>
                  {/if}
                </Table.Cell>
                <Table.Cell>
                  <Switch
                    checked={webhook.isActive}
                    disabled={webhookApi.isLoading}
                    onCheckedChange={(isChecked) => webhookApi.setActive(webhook.id, isChecked)}
                    aria-label={$t(`${T}.table.active`)}
                  />
                </Table.Cell>
                <Table.Cell>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      {#snippet child({ props })}
                        <IconButton {...props} aria-label={$t(`${T}.actions.label`)}>
                          <EllipsisVerticalIcon size={16} />
                        </IconButton>
                      {/snippet}
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                      <DropdownMenu.Item onclick={() => openEdit(webhook)}>{$t(`${T}.actions.edit`)}</DropdownMenu.Item>
                      <DropdownMenu.Item onclick={() => webhookApi.sendTest(webhook.id)}>
                        {$t(`${T}.actions.test`)}
                      </DropdownMenu.Item>
                      <DropdownMenu.Item onclick={() => (deliveriesWebhook = webhook)}>
                        {$t(`${T}.actions.deliveries`)}
                      </DropdownMenu.Item>
                      <DropdownMenu.Item onclick={() => handleRegenerateSecret(webhook)}>
                        {$t(`${T}.actions.regenerate_secret`)}
                      </DropdownMenu.Item>
                      <DropdownMenu.Item onclick={() => handleDelete(webhook)} class="ui:text-destructive">
                        {$t(`${T}.actions.delete`)}
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      {/if}
    {/if}
  </div>
</Field.Group>

{#if isFormOpen}
  <WebhookFormSheet webhook={editingWebhook} onClose={closeForm} />
{/if}

{#if deliveriesWebhook}
  <WebhookDeliveriesSheet webhook={deliveriesWebhook} onClose={() => (deliveriesWebhook = null)} />
{/if}
