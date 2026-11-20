import { ZAnalyticsWidget, type TAnalyticsWidget, type TAnalyticsWidgetInput } from '@cio/utils/validation/analytics';
import type { TAnalyticsScopeType } from '@cio/utils/constants/analytics';

import { COHORT_WIDGETS } from './cohort';
import { COURSE_WIDGETS } from './course';
import { ORG_WIDGETS } from './org';
import { PATH_WIDGETS } from './path';

function parseWidgets(widgets: readonly TAnalyticsWidgetInput[]): TAnalyticsWidget[] {
  return widgets.map((widget) => ZAnalyticsWidget.parse(widget));
}

const cohortWidgets = parseWidgets(COHORT_WIDGETS);
const courseWidgets = parseWidgets(COURSE_WIDGETS);
const orgWidgets = parseWidgets(ORG_WIDGETS);
const pathWidgets = parseWidgets(PATH_WIDGETS);

export const ANALYTICS_PRESETS: Record<TAnalyticsScopeType, TAnalyticsWidget[]> = {
  cohort: cohortWidgets,
  course: courseWidgets,
  org: orgWidgets,
  path: pathWidgets
};
