import type { TAnalyticsWidgetInput } from '@cio/utils/validation/analytics';

import { COHORT_WIDGETS } from './cohort';

const PATH_TITLE_KEYS: Record<string, string> = {
  courses_summary: 'analytics.widgets.courses_in_path.title',
  overdue: 'analytics.widgets.overdue_path.title'
};

export const PATH_WIDGETS: readonly TAnalyticsWidgetInput[] = COHORT_WIDGETS.map((widget) => {
  const titleKey = PATH_TITLE_KEYS[widget.id];

  return titleKey ? { ...widget, titleKey } : widget;
});
