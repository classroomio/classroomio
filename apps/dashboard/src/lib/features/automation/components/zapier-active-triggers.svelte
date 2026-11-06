<script lang="ts">
  import ZapIcon from '@lucide/svelte/icons/zap';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Item from '@cio/ui/base/item';
  import { Empty } from '@cio/ui/custom/empty';

  import type { ZapierConnection, ZapierTrigger } from '$features/automation/utils/types';
  import { formatZapierDate, getZapierTriggerKey } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    connections: readonly ZapierConnection[];
    onViewConnection: (connection: ZapierConnection) => void;
    onRedeliver?: (trigger: ZapierTrigger) => void;
    redeliveringId?: string | null;
  }

  let { connections, onViewConnection, onRedeliver, redeliveringId = null }: Props = $props();

  const T = 'automation.zapier';
  const FAILED_EVENT_WINDOW_MS = 24 * 60 * 60 * 1000;

  const rows = $derived(
    connections.flatMap((connection) =>
      connection.triggers.map((trigger) => ({
        connection,
        trigger,
        key: `${connection.consentId}:${trigger.id}`
      }))
    )
  );

  function hasRecentFailure(trigger: ZapierTrigger): boolean {
    if (trigger.lastDeliveryStatus !== 'FAILED' && trigger.lastDeliveryStatus !== 'GAVE_UP') return false;
    if (!trigger.lastDeliveryAt) return false;

    return Date.now() - new Date(trigger.lastDeliveryAt).getTime() <= FAILED_EVENT_WINDOW_MS;
  }
</script>

{#if rows.length === 0}
  <Empty title={$t(`${T}.triggers.empty_title`)} description={$t(`${T}.triggers.empty_description`)} icon={ZapIcon} />
{:else}
  <div class="space-y-2">
    {#each rows as row (row.key)}
      {@const triggerKey = getZapierTriggerKey(row.trigger.eventType)}
      {@const failed = hasRecentFailure(row.trigger)}
      <Item.Root variant="outline" size="sm">
        <Item.Media variant="icon">
          <ZapIcon class="custom size-4" />
        </Item.Media>
        <Item.Content>
          <Item.Title>
            {triggerKey ? $t(`${T}.catalog_triggers.${triggerKey}.label`) : row.trigger.eventType}
          </Item.Title>
          <Item.Description>
            {#if row.trigger.courseTitle}
              {$t(`${T}.triggers.course_filter`, { course: row.trigger.courseTitle })}
              <span aria-hidden="true">·</span>
            {/if}
            {row.trigger.lastDeliveryAt
              ? $t(`${T}.triggers.last_delivery`, { date: formatZapierDate(row.trigger.lastDeliveryAt) ?? '' })
              : $t(`${T}.triggers.no_deliveries`)}
          </Item.Description>
        </Item.Content>
        <Item.Actions>
          {#if failed}
            <Badge variant="destructive">{$t(`${T}.triggers.last_failed`)}</Badge>
          {/if}
          <Badge variant={row.trigger.health === 'healthy' ? 'secondary' : 'destructive'}>
            {$t(`${T}.triggers.health_${row.trigger.health}`)}
          </Badge>
          {#if failed && onRedeliver}
            <Button
              variant="outline"
              size="sm"
              loading={redeliveringId === row.trigger.id}
              onclick={() => onRedeliver?.(row.trigger)}
              testId="zapier-trigger-redeliver-{row.trigger.id}"
            >
              {$t(`${T}.triggers.redeliver`)}
            </Button>
          {/if}
          <Button variant="ghost" size="sm" onclick={() => onViewConnection(row.connection)}>
            {$t(`${T}.connections.view_triggers`)}
          </Button>
        </Item.Actions>
      </Item.Root>
    {/each}
  </div>
{/if}
