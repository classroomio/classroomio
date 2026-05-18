<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import * as Table from '@cio/ui/base/table';
  import { Badge } from '@cio/ui/base/badge';
  import { Empty } from '@cio/ui/custom/empty';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { t } from '$lib/utils/functions/translations';
  import type { ComplianceLearnerRow } from '../utils/types';

  interface Props {
    rows: ComplianceLearnerRow[];
    statusFilter?: ComplianceLearnerRow['status'] | 'all';
  }

  let { rows, statusFilter = 'all' }: Props = $props();

  const filtered = $derived(statusFilter === 'all' ? rows : rows.filter((row) => row.status === statusFilter));

  const statusTone: Record<ComplianceLearnerRow['status'], string> = {
    compliant: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    expiring_soon: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    in_grace_period: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    non_compliant: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    waived: 'ui:bg-muted ui:text-muted-foreground',
    in_progress: 'ui:bg-primary/10 ui:text-primary',
    not_started: 'ui:bg-muted ui:text-muted-foreground',
    no_record: 'ui:bg-muted ui:text-muted-foreground'
  };

  function statusLabel(status: ComplianceLearnerRow['status']) {
    return $t(`compliance.status.${status}`);
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>{$t('compliance.learners.heading')}</Card.Title>
    <Card.Description>
      {$t('compliance.learners.subtitle', { count: filtered.length })}
    </Card.Description>
  </Card.Header>
  <Card.Content>
    {#if filtered.length === 0}
      <Empty icon={UsersIcon} title={$t('compliance.learners.empty')} />
    {:else}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{$t('compliance.learners.learner')}</Table.Head>
            <Table.Head>{$t('compliance.learners.course')}</Table.Head>
            <Table.Head>{$t('compliance.learners.status')}</Table.Head>
            <Table.Head>{$t('compliance.learners.due_date')}</Table.Head>
            <Table.Head>{$t('compliance.learners.expires')}</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each filtered as row (row.groupMemberId + ':' + row.courseId)}
            <Table.Row>
              <Table.Cell>
                <div class="flex items-center gap-2">
                  <UserAvatar src={row.avatarUrl} alt={row.fullname ?? row.email ?? 'Learner'} class="h-7 w-7" />
                  <div class="min-w-0">
                    <p class="ui:text-foreground truncate text-sm font-medium">{row.fullname ?? '—'}</p>
                    <p class="ui:text-muted-foreground truncate text-xs">{row.email ?? ''}</p>
                  </div>
                </div>
              </Table.Cell>
              <Table.Cell class="text-sm">{row.courseTitle}</Table.Cell>
              <Table.Cell>
                <Badge variant="outline" class={statusTone[row.status]}>{statusLabel(row.status)}</Badge>
              </Table.Cell>
              <Table.Cell class="ui:text-muted-foreground text-sm">{formatDate(row.dueDate)}</Table.Cell>
              <Table.Cell class="ui:text-muted-foreground text-sm">{formatDate(row.validUntil)}</Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/if}
  </Card.Content>
</Card.Root>
