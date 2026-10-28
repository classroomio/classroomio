import { ZInsightsWidget, type TInsightsWidget, type TInsightsWidgetInput } from '@cio/utils/validation/insights';
import type { TInsightsScopeType } from '@cio/utils/constants/insights';

import { COHORT_WIDGETS } from './cohort';
import { COURSE_WIDGETS } from './course';
import { ORG_WIDGETS } from './org';

function parseWidgets(widgets: readonly TInsightsWidgetInput[]): TInsightsWidget[] {
  return widgets.map((widget) => ZInsightsWidget.parse(widget));
}

export const INSIGHTS_PRESETS: Record<TInsightsScopeType, TInsightsWidget[]> = {
  cohort: parseWidgets(COHORT_WIDGETS),
  course: parseWidgets(COURSE_WIDGETS),
  org: parseWidgets(ORG_WIDGETS)
};
