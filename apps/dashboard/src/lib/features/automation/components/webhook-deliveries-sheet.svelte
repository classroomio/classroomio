<script lang="ts">
  import { onMount } from 'svelte';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Select from '@cio/ui/base/select';
  import * as Sheet from '@cio/ui/base/sheet';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import * as Table from '@cio/ui/base/table';
  import * as Code from '@cio/ui/custom/code';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { WEBHOOK_DELIVERY_STATUSES } from '@cio/utils/constants/webhook';

  import { webhookApi } from '$features/automation/api/webhook.svelte';
  import type { Webhook, WebhookDeliveryStatus } from '$features/automation/utils/types';
  import {
    formatWebhookTimestamp,
    WEBHOOK_DELIVERIES_PAGE_SIZE,
    WEBHOOK_DELIVERY_STATUS_BADGE
  } from '$features/automation/utils/webhook-utils';
  import { TablePagination } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    webhook: Webhook;
    onClose: () => void;
  }

  let { webhook, onClose }: Props = $props();

  const T = 'automation.webhooks.deliveries';
  const ALL_STATUSES = 'ALL';

  let statusFilter = $state<WebhookDeliveryStatus | typeof ALL_STATUSES>(ALL_STATUSES);
  let currentPage = $state(1);

  const deliveries = $derived(webhookApi.deliveries);
  const pagination = $derived(webhookApi.deliveryPagination);
  const selectedDelivery = $derived(webhookApi.selectedDelivery);

  function reload(page = currentPage) {
    currentPage = page;
    void webhookApi.listDeliveries(webhook.id, {
      page,
      status: statusFilter === ALL_STATUSES ? undefined : statusFilter
    });
  }

  function handleRefresh() {
    if (selectedDelivery) {
      void webhookApi.loadDelivery(webhook.id, selectedDelivery.id);

      return;
    }

    reload();
  }

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) return;

    webhookApi.clearDeliveries();
    onClose();
  }

  function handleStatusChange(value: string) {
    statusFilter = value as WebhookDeliveryStatus | typeof ALL_STATUSES;
    reload(1);
  }

  async function openDelivery(deliveryId: string) {
    await webhookApi.loadDelivery(webhook.id, deliveryId);
  }

  async function handleRedeliver(deliveryId: string) {
    const result = await webhookApi.redeliver(webhook.id, deliveryId);

    if (!result) return;

    reload();
    await webhookApi.loadDelivery(webhook.id, deliveryId);
  }

  onMount(() => {
    webhookApi.clearDeliveries();
    reload(1);
  });
</script>

<Sheet.Root open={true} onOpenChange={handleOpenChange}>
  <Sheet.Content class="w-full sm:max-w-3xl" data-testid="webhook-deliveries-sheet">
    <Sheet.Header>
      <div class="flex items-start justify-between gap-2 pr-8">
        <div class="flex flex-col gap-1.5">
          <Sheet.Title>{$t(`${T}.title`)}</Sheet.Title>
          <Sheet.Description>{webhook.name} · {$t(`${T}.description`)}</Sheet.Description>
        </div>
        <IconButton
          variant="secondary"
          size="icon-sm"
          tooltip={$t('common.refresh')}
          aria-label={$t('common.refresh')}
          onclick={handleRefresh}
        >
          <RefreshCwIcon />
        </IconButton>
      </div>
    </Sheet.Header>

    <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-4 pb-4">
      {#if selectedDelivery}
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between gap-2">
            <Button
              variant="link"
              class="h-fit! justify-start! px-2! py-2!"
              onclick={() => (webhookApi.selectedDelivery = null)}
            >
              <ArrowLeftIcon class="custom" />
              <span class="text-xs">{$t(`${T}.back`)}</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onclick={() => handleRedeliver(selectedDelivery.id)}
              testId="webhook-redeliver"
            >
              <RotateCcwIcon size={16} />
              {$t(`${T}.redeliver`)}
            </Button>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Badge variant={WEBHOOK_DELIVERY_STATUS_BADGE[selectedDelivery.status]}>
              {$t(`${T}.status.${selectedDelivery.status}`)}
            </Badge>
            {#if selectedDelivery.isTest}
              <Badge variant="outline">{$t(`${T}.test_badge`)}</Badge>
            {/if}
            <span class="font-mono text-xs">{selectedDelivery.eventType}</span>
          </div>

          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="ui:text-muted-foreground">{$t(`${T}.columns.event_id`)}</dt>
              <dd class="font-mono text-xs break-all">{selectedDelivery.eventId}</dd>
            </div>
            <div>
              <dt class="ui:text-muted-foreground">{$t(`${T}.columns.attempt`)}</dt>
              <dd>{selectedDelivery.attempt}</dd>
            </div>
            <div>
              <dt class="ui:text-muted-foreground">{$t(`${T}.columns.http`)}</dt>
              <dd>{selectedDelivery.responseStatus ?? '—'}</dd>
            </div>
            <div>
              <dt class="ui:text-muted-foreground">{$t(`${T}.columns.duration`)}</dt>
              <dd>{selectedDelivery.durationMs === null ? '—' : `${selectedDelivery.durationMs} ms`}</dd>
            </div>
            <div>
              <dt class="ui:text-muted-foreground">{$t(`${T}.columns.time`)}</dt>
              <dd>{formatWebhookTimestamp(selectedDelivery.createdAt)}</dd>
            </div>
            {#if selectedDelivery.nextAttemptAt}
              <div>
                <dt class="ui:text-muted-foreground">{$t(`${T}.columns.next_attempt`)}</dt>
                <dd>{formatWebhookTimestamp(selectedDelivery.nextAttemptAt)}</dd>
              </div>
            {/if}
          </dl>

          {#if selectedDelivery.errorMessage}
            <div class="ui:border-destructive/30 ui:bg-destructive/5 rounded-md border p-3 text-sm">
              <p class="font-medium">{$t(`${T}.detail.error`)}</p>
              <p class="mt-1 break-words">{selectedDelivery.errorMessage}</p>
            </div>
          {/if}

          <div class="space-y-2">
            <p class="text-sm font-medium">{$t(`${T}.detail.request_headers`)}</p>
            <Code.Overflow>
              <Code.Root code={JSON.stringify(selectedDelivery.requestHeaders, null, 2)} hideLines={true}>
                <Code.CopyButton />
              </Code.Root>
            </Code.Overflow>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium">{$t(`${T}.detail.payload`)}</p>
            <Code.Overflow>
              <Code.Root code={JSON.stringify(selectedDelivery.payload, null, 2)} hideLines={true}>
                <Code.CopyButton />
              </Code.Root>
            </Code.Overflow>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium">{$t(`${T}.detail.response_body`)}</p>
            {#if selectedDelivery.responseBody}
              <Code.Overflow>
                <Code.Root code={selectedDelivery.responseBody} hideLines={true}>
                  <Code.CopyButton />
                </Code.Root>
              </Code.Overflow>
            {:else}
              <p class="ui:text-muted-foreground text-sm">{$t(`${T}.detail.no_response`)}</p>
            {/if}
          </div>
        </div>
      {:else}
        <div class="w-48">
          <Select.Root type="single" value={statusFilter} onValueChange={handleStatusChange}>
            <Select.Trigger>
              {statusFilter === ALL_STATUSES ? $t(`${T}.filter_all`) : $t(`${T}.status.${statusFilter}`)}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value={ALL_STATUSES}>{$t(`${T}.filter_all`)}</Select.Item>
              {#each WEBHOOK_DELIVERY_STATUSES as status (status)}
                <Select.Item value={status}>{$t(`${T}.status.${status}`)}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <div class="ui:border-border overflow-x-auto rounded-md border">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>{$t(`${T}.columns.event`)}</Table.Head>
                <Table.Head>{$t(`${T}.columns.status`)}</Table.Head>
                <Table.Head>{$t(`${T}.columns.attempt`)}</Table.Head>
                <Table.Head>{$t(`${T}.columns.http`)}</Table.Head>
                <Table.Head>{$t(`${T}.columns.time`)}</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#if !deliveries}
                {#each [0, 1, 2] as index (index)}
                  <Table.Row>
                    {#each [0, 1, 2, 3, 4] as cell (cell)}
                      <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
                    {/each}
                  </Table.Row>
                {/each}
              {:else if deliveries.length === 0}
                <Table.Row>
                  <Table.Cell colspan={5} class="ui:text-muted-foreground py-8 text-center text-sm">
                    {$t(`${T}.empty`)}
                  </Table.Cell>
                </Table.Row>
              {:else}
                {#each deliveries as delivery (delivery.id)}
                  <Table.Row class="cursor-pointer" onclick={() => openDelivery(delivery.id)}>
                    <Table.Cell class="font-mono text-xs">
                      {delivery.eventType}
                      {#if delivery.isTest}
                        <Badge variant="outline" class="ml-1">{$t(`${T}.test_badge`)}</Badge>
                      {/if}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={WEBHOOK_DELIVERY_STATUS_BADGE[delivery.status]}>
                        {$t(`${T}.status.${delivery.status}`)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{delivery.attempt}</Table.Cell>
                    <Table.Cell>{delivery.responseStatus ?? '—'}</Table.Cell>
                    <Table.Cell class="ui:text-muted-foreground text-sm">
                      {formatWebhookTimestamp(delivery.createdAt)}
                    </Table.Cell>
                  </Table.Row>
                {/each}
              {/if}
            </Table.Body>
          </Table.Root>
        </div>

        {#if pagination && pagination.total > WEBHOOK_DELIVERIES_PAGE_SIZE}
          <TablePagination
            count={pagination.total}
            perPage={WEBHOOK_DELIVERIES_PAGE_SIZE}
            page={currentPage}
            onPageChange={reload}
          />
        {/if}
      {/if}
    </div>
  </Sheet.Content>
</Sheet.Root>
