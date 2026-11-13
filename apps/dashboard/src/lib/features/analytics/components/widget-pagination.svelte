<script lang="ts">
  import { TablePagination } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { analyticsApi } from '../api';
  import { widgetPaginationLabel } from '../utils/analytics-utils';
  import type { AnalyticsResult, AnalyticsWidget, AnalyticsWidgetContext } from '../utils/types';

  interface Props {
    widget: AnalyticsWidget;
    pageGroup: string;
    result: AnalyticsResult;
    context?: AnalyticsWidgetContext;
  }

  let { widget, pageGroup, result, context }: Props = $props();

  const perPage = $derived(widget.spec.limit);
  const page = $derived(analyticsApi.pageState(pageGroup).page);
  const from = $derived((page - 1) * perPage + 1);
  const to = $derived(Math.min(page * perPage, result.total));

  const label = $derived(
    widgetPaginationLabel(
      {
        pageGroup,
        from,
        to,
        total: result.total,
        scopeType: context?.scopeType
      },
      $t
    )
  );
</script>

{#if result.total > perPage}
  <div class="flex flex-col items-center justify-between gap-2 pt-4 sm:flex-row">
    <p class="ui:text-muted-foreground text-xs tabular-nums">{label}</p>
    <TablePagination
      count={result.total}
      {perPage}
      {page}
      onPageChange={(nextPage) => analyticsApi.setPage(pageGroup, nextPage)}
    />
  </div>
{/if}
