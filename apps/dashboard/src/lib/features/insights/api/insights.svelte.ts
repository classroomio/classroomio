import { BaseApi, classroomio } from '$lib/utils/services/api';

import {
  defaultCourseId,
  defaultExerciseId,
  isWidgetVisible,
  oldestGeneratedAt,
  resolveWidgetSpec,
  SELF_LOADING_WIDGET_IDS,
  widgetUsesPlaceholder
} from '../utils/insights-utils';
import type {
  InsightsDashboard,
  InsightsDashboardRequest,
  InsightsQueryRequest,
  InsightsResult,
  InsightsScopeRef,
  InsightsSelection,
  InsightsWidget,
  InsightsWidgetState
} from '../utils/types';

const IDLE_WIDGET: InsightsWidgetState = { result: null, loading: false, failed: false };

class InsightsApi extends BaseApi {
  scope = $state<InsightsScopeRef | null>(null);
  dashboard = $state<InsightsDashboard | null>(null);
  dashboardFailed = $state(false);
  selection = $state<InsightsSelection>({ courseId: null, learnerId: null, exerciseId: null });
  widgetStates = $state<Record<string, InsightsWidgetState>>({});

  #dashboardSeq = 0;
  #widgetSeq = new Map<string, number>();

  get visibleWidgets(): InsightsWidget[] {
    const dashboard = this.dashboard;
    if (!dashboard) return [];

    return dashboard.widgets.filter((widget) => isWidgetVisible(widget, dashboard, this.selection));
  }

  get generatedAt(): string | null {
    const results = this.visibleWidgets.map((widget) => this.widgetState(widget.id).result);

    return oldestGeneratedAt(results);
  }

  get isRefetching(): boolean {
    return Object.values(this.widgetStates).some((state) => state.loading && state.result !== null);
  }

  widgetState(widgetId: string): InsightsWidgetState {
    return this.widgetStates[widgetId] ?? IDLE_WIDGET;
  }

  widgetResult(widgetId: string): InsightsResult | null {
    return this.widgetState(widgetId).result;
  }

  async loadDashboard(scope: InsightsScopeRef) {
    this.#dashboardSeq += 1;
    const dashboardSeq = this.#dashboardSeq;

    this.#resetView(scope);

    await this.execute<InsightsDashboardRequest>({
      requestFn: () =>
        classroomio.insights.dashboards[':scopeType'][':scopeId'].$get({
          param: { scopeType: scope.type, scopeId: scope.id }
        }),
      logContext: 'loading insights dashboard',
      onSuccess: (response) => {
        if (dashboardSeq !== this.#dashboardSeq) return;

        this.dashboard = response.data;
        this.selection.courseId = defaultCourseId(response.data);
        this.selection.exerciseId = this.#defaultExercise(response.data);
      },
      onError: () => {
        if (dashboardSeq !== this.#dashboardSeq) return;

        this.dashboardFailed = true;
      }
    });

    if (dashboardSeq !== this.#dashboardSeq) return;

    await this.runVisibleWidgets();
  }

  async runVisibleWidgets(options: { refresh?: boolean } = {}) {
    const widgets = this.visibleWidgets.filter((widget) => !SELF_LOADING_WIDGET_IDS.has(widget.id));

    await Promise.all(widgets.map((widget) => this.runWidget(widget, options)));
  }

  async runWidget(widget: InsightsWidget, options: { refresh?: boolean } = {}) {
    const scope = this.scope;
    const spec = resolveWidgetSpec(widget, this.selection);
    if (!scope || !spec) return;

    const widgetSeq = (this.#widgetSeq.get(widget.id) ?? 0) + 1;
    const previous = this.widgetState(widget.id);
    this.#widgetSeq.set(widget.id, widgetSeq);
    this.widgetStates[widget.id] = { ...previous, loading: true, failed: false };

    await this.execute<InsightsQueryRequest>({
      requestFn: () => classroomio.insights.query.$post({ json: { scope, spec, refresh: options.refresh } }),
      logContext: `loading insights widget ${widget.id}`,
      onSuccess: (response) => {
        if (this.#widgetSeq.get(widget.id) !== widgetSeq) return;

        this.widgetStates[widget.id] = { result: response.data, loading: false, failed: false };
      },
      onError: () => {
        if (this.#widgetSeq.get(widget.id) !== widgetSeq) return;

        this.widgetStates[widget.id] = { ...previous, loading: false, failed: true };
      }
    });
  }

  async selectCourse(courseId: string | null) {
    this.selection.courseId = courseId;
    this.selection.exerciseId = null;

    await this.runVisibleWidgets();
  }

  async selectLearner(learnerId: string) {
    this.selection.learnerId = learnerId;
    const widgets = this.visibleWidgets.filter((widget) => widgetUsesPlaceholder(widget, 'learner'));

    await Promise.all(widgets.map((widget) => this.runWidget(widget)));
  }

  async selectExercise(exerciseId: string) {
    this.selection.exerciseId = exerciseId;
    const widgets = this.visibleWidgets.filter((widget) => widgetUsesPlaceholder(widget, 'exercise'));

    await Promise.all(widgets.map((widget) => this.runWidget(widget)));
  }

  refreshAll() {
    return this.runVisibleWidgets({ refresh: true });
  }

  poll() {
    return this.runVisibleWidgets();
  }

  reset() {
    this.#dashboardSeq += 1;
    this.#resetView(null);
  }

  #resetView(scope: InsightsScopeRef | null) {
    this.scope = scope;
    this.dashboard = null;
    this.dashboardFailed = false;
    this.widgetStates = {};
    this.selection.courseId = null;
    this.selection.learnerId = null;
    this.selection.exerciseId = null;
    this.#widgetSeq.clear();
  }

  #defaultExercise(dashboard: InsightsDashboard): string | null {
    if (dashboard.scope.type !== 'course') return null;

    const courseId = dashboard.scope.courses[0]?.id;

    return courseId ? defaultExerciseId(dashboard.structures[courseId]) : null;
  }
}

export const insightsApi = new InsightsApi();
