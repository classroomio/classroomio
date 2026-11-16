<script lang="ts">
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
  import { hasSegmentDrilldown, hasWholeDrilldown } from '@cio/utils/analytics';
  import { ANALYTICS_RANGE_DAYS } from '@cio/utils/constants/analytics';
  import { Button } from '@cio/ui/base/button';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { downloadCsv } from '$features/ui/export';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';

  import { analyticsApi, analyticsDrilldownApi } from '../api';
  import { buildWidgetExportDocument } from '../utils/analytics-export';
  import { formatKpi } from '../utils/analytics-utils';
  import type { AnalyticsWidget } from '../utils/types';

  interface Props {
    widget: AnalyticsWidget;
    title: string;
    hasStudents?: boolean;
  }

  let { widget, title, hasStudents = true }: Props = $props();

  const result = $derived(analyticsApi.widgetState(widget.id).result);
  const wholeDrilldown = $derived(hasWholeDrilldown(widget.id) ? analyticsDrilldownApi.forWidget(widget, null) : null);
  const studentsTab = $derived(wholeDrilldown ? analyticsDrilldownApi.studentsTabFor(wholeDrilldown) : null);
  const hasAnyDrilldown = $derived(hasWholeDrilldown(widget.id) || hasSegmentDrilldown(widget.id));

  function exportCsv() {
    if (!result) return;

    const rangeDays = ANALYTICS_RANGE_DAYS[analyticsApi.selection.range];
    const kpi = formatKpi(widget, result, $t, {
      courseSelected: Boolean(analyticsApi.selection.courseId),
      rangeDays,
      hasStudents
    });
    const subtitle = analyticsApi.dashboard?.scope.name;
    const document = buildWidgetExportDocument({ widget, result, title, subtitle, kpi, translate: $t });
    if (document.rows.length === 0) {
      snackbar.error('export.nothing_to_export');
      return;
    }

    downloadCsv(document);
  }
</script>

<DropdownMenu.DropdownMenu>
  <DropdownMenu.DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="secondary"
        size="icon"
        class="size-7"
        aria-label={$t('analytics.widget_menu.label', { title })}
        testId="analytics-widget-menu-{widget.id}"
      >
        <EllipsisIcon />
      </Button>
    {/snippet}
  </DropdownMenu.DropdownMenuTrigger>
  <DropdownMenu.DropdownMenuContent align="end">
    {#if wholeDrilldown}
      <DropdownMenu.DropdownMenuItem
        data-testid="analytics-widget-menu-view-students"
        onSelect={() => void analyticsDrilldownApi.open(wholeDrilldown)}
      >
        {$t('analytics.widget_menu.view_students')}
      </DropdownMenu.DropdownMenuItem>
    {/if}
    <DropdownMenu.DropdownMenuItem data-testid="analytics-widget-menu-export" disabled={!result} onSelect={exportCsv}>
      {$t('export.as_csv')}
    </DropdownMenu.DropdownMenuItem>
    {#if wholeDrilldown && studentsTab}
      <DropdownMenu.DropdownMenuItem
        data-testid="analytics-widget-menu-open-students"
        onSelect={() => void analyticsDrilldownApi.openInStudentsTab(wholeDrilldown)}
      >
        {$t('analytics.widget_menu.open_in_students')}
      </DropdownMenu.DropdownMenuItem>
    {/if}
    {#if hasAnyDrilldown && !wholeDrilldown}
      <DropdownMenu.DropdownMenuLabel class="ui:text-muted-foreground text-xs font-normal">
        {$t('analytics.widget_menu.click_to_view')}
      </DropdownMenu.DropdownMenuLabel>
    {/if}
  </DropdownMenu.DropdownMenuContent>
</DropdownMenu.DropdownMenu>
