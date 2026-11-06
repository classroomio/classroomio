<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';

  import { formatCount, formatPercent } from '../../utils/insights-utils';
  import type { InsightsCell, InsightsColumn, WidgetRendererProps } from '../../utils/types';

  let { result }: WidgetRendererProps = $props();

  const columns = $derived(result.columns);

  function headerLabel(column: InsightsColumn): string {
    if (column.role === 'dimension') {
      return $t(`insights.columns.${column.key}`);
    }

    return $t(`insights.measures.${column.key}`);
  }

  function formatCell(value: InsightsCell | undefined, column: InsightsColumn): string {
    if (value === null || value === undefined) return '–';

    if (column.valueType === 'percent') return formatPercent(value);

    if (column.valueType === 'integer' || column.valueType === 'number') return formatCount(value);

    if (column.valueType === 'date' && typeof value === 'string') {
      return new Date(value).toLocaleDateString();
    }

    return String(value);
  }
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      {#each columns as column (column.key)}
        <Table.Head class={column.role === 'measure' ? 'text-right' : ''}>
          {headerLabel(column)}
        </Table.Head>
      {/each}
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row, index (index)}
      <Table.Row>
        {#each columns as column (column.key)}
          <Table.Cell class={column.role === 'measure' ? 'text-right tabular-nums' : 'font-medium'}>
            {#if column.role === 'dimension'}
              {row[`${column.key}_label`] ?? row[`${column.key}_id`] ?? '–'}
            {:else}
              {formatCell(row[column.key], column)}
            {/if}
          </Table.Cell>
        {/each}
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
