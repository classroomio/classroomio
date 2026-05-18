<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import * as Table from '@cio/ui/base/table';
  import { Empty } from '@cio/ui/custom/empty';
  import BookIcon from '@lucide/svelte/icons/book';
  import { t } from '$lib/utils/functions/translations';
  import type { ComplianceCourseRow } from '../utils/types';

  interface Props {
    rows: ComplianceCourseRow[];
  }

  let { rows }: Props = $props();
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>{$t('compliance.courses.heading')}</Card.Title>
    <Card.Description>{$t('compliance.courses.description')}</Card.Description>
  </Card.Header>
  <Card.Content>
    {#if rows.length === 0}
      <Empty icon={BookIcon} title={$t('compliance.courses.empty')} />
    {:else}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{$t('compliance.courses.course')}</Table.Head>
            <Table.Head class="text-right">{$t('compliance.courses.learners')}</Table.Head>
            <Table.Head class="text-right">{$t('compliance.status.compliant')}</Table.Head>
            <Table.Head class="text-right">{$t('compliance.status.expiring_soon')}</Table.Head>
            <Table.Head class="text-right">{$t('compliance.status.non_compliant')}</Table.Head>
            <Table.Head class="text-right">{$t('compliance.courses.completion')}</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as row (row.courseId)}
            {@const complete = row.counts.compliant}
            {@const percent = row.learnerCount > 0 ? Math.round((complete / row.learnerCount) * 100) : 0}
            <Table.Row>
              <Table.Cell class="font-medium">{row.courseTitle}</Table.Cell>
              <Table.Cell class="text-right tabular-nums">{row.learnerCount}</Table.Cell>
              <Table.Cell class="text-right tabular-nums">{row.counts.compliant}</Table.Cell>
              <Table.Cell class="text-right tabular-nums">{row.counts.expiring_soon}</Table.Cell>
              <Table.Cell class="text-right tabular-nums">{row.counts.non_compliant}</Table.Cell>
              <Table.Cell class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <div class="ui:bg-muted h-1.5 w-20 overflow-hidden rounded-full">
                    <div class="ui:bg-primary h-full" style="width: {percent}%"></div>
                  </div>
                  <span class="ui:text-muted-foreground w-9 text-right text-xs tabular-nums">{percent}%</span>
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/if}
  </Card.Content>
</Card.Root>
