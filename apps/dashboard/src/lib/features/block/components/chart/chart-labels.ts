import type { ChartBlockLabels } from '@cio/ui/custom/block';
import { t } from '$lib/utils/functions/translations';
import type { ChartExampleCopy } from './chart-utils';

const KEY = 'course.navItem.lessons.materials.blocks.chart';

export function getChartLabels(): ChartBlockLabels {
  return {
    title: t.get(`${KEY}.title`),
    titlePlaceholder: t.get(`${KEY}.title_placeholder`),
    chartType: t.get(`${KEY}.chart_type`),
    types: {
      bar: t.get(`${KEY}.types.bar`),
      line: t.get(`${KEY}.types.line`),
      pie: t.get(`${KEY}.types.pie`),
      donut: t.get(`${KEY}.types.donut`)
    },
    pointCount: (count) => t.get(`${KEY}.point_count`, { count }),
    highest: t.get(`${KEY}.highest`),
    total: t.get(`${KEY}.total`),
    editData: t.get(`${KEY}.edit_data`),
    liveHint: t.get(`${KEY}.live_hint`),
    labelColumn: t.get(`${KEY}.label`),
    valueColumn: t.get(`${KEY}.value`),
    labelPlaceholder: t.get(`${KEY}.label_placeholder`),
    addPoint: t.get(`${KEY}.add_point`),
    removePoint: t.get(`${KEY}.remove_point`)
  };
}

export function getNewPointLabel(): string {
  return t.get(`${KEY}.new_point`);
}

export function getChartExampleCopy(): ChartExampleCopy {
  return {
    title: t.get(`${KEY}.example.title`),
    labels: [1, 2, 3, 4].map((number) => t.get(`${KEY}.example.label_${number}`))
  };
}
