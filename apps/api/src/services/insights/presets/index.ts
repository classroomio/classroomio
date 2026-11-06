import { ZInsightsWidget, type TInsightsWidget, type TInsightsWidgetInput } from '@cio/utils/validation/insights';
import type { TInsightsScopeType } from '@cio/utils/constants/insights';

import { COHORT_WIDGETS } from './cohort';
import { COURSE_WIDGETS } from './course';
import { ORG_WIDGETS } from './org';

function parseWidgets(widgets: readonly TInsightsWidgetInput[]): TInsightsWidget[] {
  return widgets.map((widget) => ZInsightsWidget.parse(widget));
}

const cohortWidgets = parseWidgets(COHORT_WIDGETS);
const courseWidgets = parseWidgets(COURSE_WIDGETS);
const orgWidgets = parseWidgets(ORG_WIDGETS);

export const INSIGHTS_PRESETS: Record<TInsightsScopeType, TInsightsWidget[]> = {
  cohort: cohortWidgets,
  course: courseWidgets,
  org: orgWidgets
};
