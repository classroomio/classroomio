<script lang="ts">
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import { Badge } from '@cio/ui/base/badge';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Table from '@cio/ui/base/table';
  import { IconButton } from '@cio/ui/custom/icon-button';

  import type { ZapierConnection } from '$features/automation/utils/types';
  import { formatZapierDate, getZapierAccess } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  const T = 'automation.zapier.connections';

  interface Props {
    connections: ZapierConnection[];
    canManage: boolean;
    onViewTriggers: (connection: ZapierConnection) => void;
    onRemove: (connection: ZapierConnection) => void;
  }

  let { connections, canManage, onViewTriggers, onRemove }: Props = $props();
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>{$t(`${T}.authorized_by`)}</Table.Head>
      <Table.Head>{$t(`${T}.access`)}</Table.Head>
      <Table.Head>{$t(`${T}.triggers`)}</Table.Head>
      <Table.Head>{$t(`${T}.last_used`)}</Table.Head>
      <Table.Head>{$t(`${T}.connected`)}</Table.Head>
      <Table.Head class="w-10"></Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each connections as connection (connection.consentId)}
      <Table.Row>
        <Table.Cell class="font-medium">{connection.authorizedBy.fullname ?? $t(`${T}.unknown_admin`)}</Table.Cell>
        <Table.Cell>
          <Badge variant="secondary">{$t(`${T}.access_${getZapierAccess(connection.scopes)}`)}</Badge>
        </Table.Cell>
        <Table.Cell>{connection.triggers.length}</Table.Cell>
        <Table.Cell class="ui:text-muted-foreground text-sm">
          {formatZapierDate(connection.lastUsedAt) ?? $t('automation.keys.never_used')}
        </Table.Cell>
        <Table.Cell class="ui:text-muted-foreground text-sm">{formatZapierDate(connection.connectedAt)}</Table.Cell>
        <Table.Cell>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <IconButton
                  {...props}
                  variant="secondary"
                  aria-label={$t(`${T}.actions`)}
                  testId="zapier-connection-actions-{connection.consentId}"
                >
                  <EllipsisVerticalIcon size={16} />
                </IconButton>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item onclick={() => onViewTriggers(connection)}>
                {$t(`${T}.view_triggers`)}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                disabled={!canManage}
                onclick={() => onRemove(connection)}
                data-testid="zapier-connection-remove"
              >
                {$t(`${T}.remove`)}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
