<script lang="ts">
  import DownloadIcon from '@lucide/svelte/icons/download';
  import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
  import { hasExpandDrilldown, hasWholeDrilldown } from '@cio/utils/analytics';
  import { Button } from '@cio/ui/base/button';
  import * as ButtonGroup from '@cio/ui/base/button-group';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { cn } from '@cio/ui/tools';
  import { downloadCsv } from '$features/ui/export';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';

  import { analyticsApi, analyticsDrilldownApi } from '../api';
  import { buildWidgetExportDocument } from '../utils/analytics-export';
  import { drilldownSegmentSet } from '../utils/analytics-utils';
  import type { AnalyticsWidget } from '../utils/types';

  interface Props {
    widget: AnalyticsWidget;
    title: string;
  }

  let { widget, title }: Props = $props();

  let isExpandTipOpen = $state(false);
  let isDownloadTipOpen = $state(false);

  const result = $derived(analyticsApi.widgetState(widget.id).result);
  const showExpand = $derived(hasExpandDrilldown(widget.id));
  const segments = $derived(result ? drilldownSegmentSet(widget.id, result, $t) : null);
  const canExpand = $derived(
    hasWholeDrilldown(widget.id) ? analyticsDrilldownApi.forWidget(widget, null) !== null : segments !== null
  );
  const isPinned = $derived(isExpandTipOpen || isDownloadTipOpen);

  function expand() {
    if (hasWholeDrilldown(widget.id)) {
      void analyticsDrilldownApi.openForWidget(widget, null);
      return;
    }

    const firstSegment = segments?.options.find((option) => !option.isEmpty) ?? segments?.options[0];
    if (!segments || !firstSegment) return;

    void analyticsDrilldownApi.openForWidget(widget, firstSegment.key, segments);
  }

  function download() {
    if (!result) return;

    const subtitle = analyticsApi.dashboard?.scope.name;
    const document = buildWidgetExportDocument({ widget, result, title, subtitle, translate: $t });
    if (document.rows.length === 0) {
      snackbar.error('export.nothing_to_export');
      return;
    }

    downloadCsv(document);
  }
</script>

<Tooltip.Provider delayDuration={300}>
  <ButtonGroup.Root
    variant="toolbar"
    aria-label={$t('analytics.widget_toolbar.label', { title })}
    class={cn(
      'opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100',
      isPinned && 'opacity-100'
    )}
    data-testid="analytics-widget-toolbar"
  >
    {#if showExpand}
      <Tooltip.Root bind:open={isExpandTipOpen}>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="secondary"
              size="icon-sm"
              aria-label={$t('analytics.widget_toolbar.expand')}
              disabled={!canExpand}
              testId="analytics-widget-expand"
              onclick={expand}
            >
              <Maximize2Icon />
            </Button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content>{$t('analytics.widget_toolbar.expand')}</Tooltip.Content>
      </Tooltip.Root>
    {/if}
    <Tooltip.Root bind:open={isDownloadTipOpen}>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="secondary"
            size="icon-sm"
            aria-label={$t('analytics.widget_toolbar.download')}
            disabled={!result}
            testId="analytics-widget-download"
            onclick={download}
          >
            <DownloadIcon />
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content>{$t('analytics.widget_toolbar.download')}</Tooltip.Content>
    </Tooltip.Root>
  </ButtonGroup.Root>
</Tooltip.Provider>
