import {
  FREE_PLAN_INSIGHTS_DAYS,
  INSIGHTS_LIMITS,
  type TInsightsBreakdownGroup,
  type TInsightsRange
} from '@cio/utils/constants/insights';
import { get } from 'svelte/store';
import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';
import { BaseApi, classroomio } from '$lib/utils/services/api';
import { isFreePlan } from '$lib/utils/store/org';

import {
  activeBreakdownGroup,
  availableBreakdownGroups,
  clampRangeToDays,
  cohortOptionsFromResult,
  defaultBreakdownGroup,
  defaultCourseId,
  defaultExerciseId,
  FIRST_PAGE,
  isWidgetVisible,
  nextSort,
  oldestGeneratedAt,
  pageAfterEmptyResult,
  pageGroupsOf,
  resolveWidgetSpec,
  SELF_LOADING_WIDGET_IDS,
  specRequestKey,
  widgetUsesPlaceholder
} from '../utils/insights-utils';
import type {
  InsightsCohortOption,
  InsightsDashboard,
  InsightsDashboardRequest,
  InsightsPageState,
  InsightsQueryRequest,
  InsightsResult,
  InsightsScopeRef,
  InsightsSelection,
  InsightsSpec,
  InsightsWidget,
  InsightsWidgetState
} from '../utils/types';

const IDLE_WIDGET: InsightsWidgetState = { result: null, loading: false, failed: false };

/** History the current org's plan allows in days; null means every range. Read at load and select time, not reactively. */
function maxRangeDays(): number | null {
  return get(isFreePlan) ? FREE_PLAN_INSIGHTS_DAYS : null;
}

class InsightsApi extends BaseApi {
  scope = $state<InsightsScopeRef | null>(null);
  dashboard = $state<InsightsDashboard | null>(null);
  dashboardFailed = $state(false);
  selection = $state<InsightsSelection>({
    courseId: null,
    exerciseId: null,
    range: 'all',
    breakdown: 'courses',
    cohortIds: null,
    pages: {}
  });
  widgetStates = $state<Record<string, InsightsWidgetState>>({});
  cohortOptions = $state<InsightsCohortOption[]>([]);
  cohortOptionsById = $state<Record<string, InsightsCohortOption>>({});
  cohortOptionsSearch = $state('');
  cohortOptionsMatchTotal = $state(0);
  cohortOptionsLoading = $state(false);
  cohortOptionsFailed = $state(false);
  cohortOptionsHasLoaded = $state(false);
  cohortOptionsOpen = $state(false);

  #dashboardSeq = 0;
  #widgetSeq = new Map<string, number>();
  #inFlight = new Map<string, Promise<InsightsResult | null>>();
  #cohortOptionsSeq = 0;
  #cohortOptionsPage = 1;

  /** The active cohorts linked to this scope; the picker's "selected of total" never depends on a search page. */
  get cohortCount(): number {
    return this.dashboard?.scope.cohortCount ?? 0;
  }

  get cohortOptionsHasMore(): boolean {
    return this.cohortOptions.length < this.cohortOptionsMatchTotal;
  }

  get visibleWidgets(): InsightsWidget[] {
    const dashboard = this.dashboard;
    if (!dashboard) return [];

    return dashboard.widgets.filter((widget) => isWidgetVisible(widget, dashboard, this.selection));
  }

  get displayWidgets(): InsightsWidget[] {
    return this.visibleWidgets.filter((widget) => !widget.hidden);
  }

  get availableBreakdowns(): TInsightsBreakdownGroup[] {
    const dashboard = this.dashboard;
    if (!dashboard) return [];

    return availableBreakdownGroups(dashboard.scope.type, dashboard.scope);
  }

  get generatedAt(): string | null {
    const results = this.displayWidgets.map((widget) => this.widgetState(widget.id).result);

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
        this.selection.breakdown = defaultBreakdownGroup(response.data.scope);
      },
      onError: () => {
        if (dashboardSeq !== this.#dashboardSeq) return;

        this.dashboardFailed = true;
      }
    });

    if (dashboardSeq !== this.#dashboardSeq) return;

    await this.#preloadCohortOptions();
    await this.runVisibleWidgets();
  }

  async runVisibleWidgets(options: { refresh?: boolean } = {}) {
    const widgets = this.visibleWidgets.filter((widget) => !SELF_LOADING_WIDGET_IDS.has(widget.id));

    await Promise.all(widgets.map((widget) => this.runWidget(widget, options)));
  }

  async runWidget(widget: InsightsWidget, options: { refresh?: boolean } = {}) {
    const spec = resolveWidgetSpec(widget, this.selection);
    const scope = this.scope;
    if (!scope || !spec) return;

    const requestedPage = widget.pageGroup ? this.pageState(widget.pageGroup).page : 1;
    const widgetSeq = (this.#widgetSeq.get(widget.id) ?? 0) + 1;
    const previous = this.widgetState(widget.id);
    this.#widgetSeq.set(widget.id, widgetSeq);
    this.widgetStates[widget.id] = { ...previous, loading: true, failed: false };

    const result = await this.sharedQuery(spec, { refresh: Boolean(options.refresh) });
    if (this.scope !== scope || this.#widgetSeq.get(widget.id) !== widgetSeq) return;

    if (widget.pageGroup) {
      const pageState = this.pageState(widget.pageGroup);
      if (pageState.page !== requestedPage) {
        await this.runWidget(widget, options);
        return;
      }

      if (result && result.rows.length === 0 && requestedPage > 1) {
        const nextPage = pageAfterEmptyResult(requestedPage, result.total, spec.limit);
        this.selection.pages[widget.pageGroup] = { page: nextPage, sort: pageState.sort };
        await this.#runPageGroup(widget.pageGroup);
        return;
      }
    }

    this.widgetStates[widget.id] = result
      ? { result, loading: false, failed: false }
      : { ...previous, loading: false, failed: true };
  }

  async selectCourse(courseId: string | null) {
    this.selection.courseId = courseId;
    this.selection.exerciseId = null;
    this.selection.pages = {};

    await this.runVisibleWidgets();
  }

  async setBreakdown(breakdown: TInsightsBreakdownGroup) {
    if (this.selection.breakdown === breakdown || !this.availableBreakdowns.includes(breakdown)) return;

    this.selection.breakdown = breakdown;
    const widgets = this.visibleWidgets.filter((widget) => widget.breakdown === breakdown);
    this.#resetPagesFor(widgets);

    await Promise.all(widgets.map((widget) => this.runWidget(widget)));
  }

  setCohortIds(cohortIds: string[] | null) {
    this.selection.cohortIds = cohortIds;
  }

  /**
   * Loads the first page of cohorts for the picker when it opens. The picker searches on the server, so a course
   * with more cohorts than one page can never hide the rest behind a silent cap.
   */
  async loadCohortOptions() {
    if (this.cohortOptionsHasLoaded || this.cohortOptionsLoading) return;

    await this.#loadCohortOptionsPage(1, false);
  }

  /** Opening the picker always refreshes its first page, so student counts do not go stale between visits. */
  async openCohortOptions() {
    this.cohortOptionsOpen = true;

    if (this.cohortOptionsHasLoaded) {
      await this.#loadCohortOptionsPage(1, false, true);
      return;
    }

    await this.#loadCohortOptionsPage(1, false);
  }

  closeCohortOptions() {
    this.cohortOptionsOpen = false;
  }

  async searchCohortOptions(search: string) {
    const normalized = search.trim();
    if (normalized === this.cohortOptionsSearch) return;

    this.cohortOptionsSearch = normalized;
    await this.#loadCohortOptionsPage(1, false);
  }

  async loadMoreCohortOptions() {
    if (this.cohortOptionsLoading || !this.cohortOptionsHasMore) return;

    await this.#loadCohortOptionsPage(this.#cohortOptionsPage + 1, true);
  }

  async #loadCohortOptionsPage(page: number, append: boolean, refresh = false) {
    const scope = this.scope;
    if (!scope) return;

    this.#cohortOptionsSeq += 1;
    const seq = this.#cohortOptionsSeq;
    this.cohortOptionsLoading = true;
    this.cohortOptionsFailed = false;

    const result = await this.sharedQuery(
      {
        source: 'cohort_summary',
        dimensions: ['cohort'],
        measures: [
          { metric: 'students', agg: 'value' },
          { metric: 'completed_students', agg: 'value' },
          { metric: 'cohort_created_at', agg: 'value' }
        ],
        filters: [],
        sort: [{ field: 'cohort_created_at__value', dir: 'desc' }],
        search: this.cohortOptionsSearch || undefined,
        limit: INSIGHTS_LIMITS.cohortSearchPageSize,
        page,
        range: 'all'
      },
      { refresh }
    );
    if (seq !== this.#cohortOptionsSeq) return;

    this.cohortOptionsLoading = false;
    if (!result) {
      this.cohortOptionsFailed = true;
      return;
    }

    const pageOptions = cohortOptionsFromResult(result, t.get);
    const previousOptions = append ? this.cohortOptions : [];
    const previousOptionsById = Object.fromEntries(previousOptions.map((option) => [option.id, option]));
    const pageOptionsById = Object.fromEntries(pageOptions.map((option) => [option.id, option]));
    const mergedOptions = { ...previousOptionsById, ...pageOptionsById };

    this.cohortOptions = Object.values(mergedOptions);
    this.cohortOptionsById = { ...this.cohortOptionsById, ...pageOptionsById };
    this.cohortOptionsMatchTotal = result.total;
    this.#cohortOptionsPage = page;
    this.cohortOptionsHasLoaded = true;
  }

  pageState(pageGroup: string): InsightsPageState {
    return this.selection.pages[pageGroup] ?? FIRST_PAGE;
  }

  /**
   * Shows another page of a page group. Every widget in the group fetches that page, so they stay in step.
   */
  async setPage(pageGroup: string, page: number) {
    const sort = this.pageState(pageGroup).sort;
    this.selection.pages[pageGroup] = { page, sort };

    await this.#runPageGroup(pageGroup);
  }

  /**
   * Sorts a page group by a column on the server, from the first page; the same column again flips the direction.
   */
  async setSort(pageGroup: string, key: string) {
    const sort = nextSort(this.pageState(pageGroup).sort, key);
    this.selection.pages[pageGroup] = { page: 1, sort };

    await this.#runPageGroup(pageGroup);
  }

  async #runPageGroup(pageGroup: string) {
    const widgets = this.visibleWidgets.filter((widget) => widget.pageGroup === pageGroup);

    await Promise.all(widgets.map((widget) => this.runWidget(widget)));
  }

  /**
   * Clears the page and sort of the page groups the given widgets own. Widgets that are not about to run keep
   * where they were, so their visible rows and pager stay in step.
   */
  #resetPagesFor(widgets: readonly InsightsWidget[]) {
    const pageGroups = pageGroupsOf(widgets);
    if (pageGroups.length === 0) return;

    const removed = new Set(pageGroups);
    this.selection.pages = Object.fromEntries(
      Object.entries(this.selection.pages).filter(([pageGroup]) => !removed.has(pageGroup))
    );
  }

  /**
   * Switches the dashboard's range. Only the widgets that follow it run again; standing ones keep their results.
   */
  async selectRange(range: TInsightsRange) {
    this.selection.range = clampRangeToDays(range, maxRangeDays());
    const widgets = this.visibleWidgets.filter((widget) => widget.usesRange);
    this.#resetPagesFor(widgets);

    await Promise.all(widgets.map((widget) => this.runWidget(widget)));
  }

  async selectExercise(exerciseId: string) {
    this.selection.exerciseId = exerciseId;
    const widgets = this.visibleWidgets.filter((widget) => widgetUsesPlaceholder(widget, 'exercise'));
    this.#resetPagesFor(widgets);

    await Promise.all(widgets.map((widget) => this.runWidget(widget)));
  }

  async refreshAll() {
    await this.refreshDashboard({ refresh: true });
  }

  async poll() {
    await this.refreshDashboard();
  }

  /**
   * Re-reads the scope summary, reconciles a selection whose course/exercise/breakdown disappeared, then runs the
   * widgets. The picker is refreshed when it is open, or on a manual refresh if it has been opened before.
   */
  async refreshDashboard(options: { refresh?: boolean } = {}) {
    const scope = this.scope;
    if (!scope) return;

    const dashboardSeq = this.#dashboardSeq;
    const param = { scopeType: scope.type, scopeId: scope.id };
    const response = await this.execute<InsightsDashboardRequest>({
      requestFn: options.refresh
        ? () => classroomio.insights['dashboards-refresh'].$post({ json: { type: scope.type, id: scope.id } })
        : () => classroomio.insights.dashboards[':scopeType'][':scopeId'].$get({ param }),
      logContext: 'refreshing insights dashboard',
      onError: options.refresh ? () => snackbar.error('snackbar.insights.refresh_failed') : undefined
    });
    if (dashboardSeq !== this.#dashboardSeq) return;

    if (!response) {
      await this.runVisibleWidgets(options);
      await this.#refreshCohortOptionsIfNeeded(options);
      return;
    }

    this.#applySummary(response.data);

    await this.runVisibleWidgets(options);
    await this.#refreshCohortOptionsIfNeeded(options);
  }

  /**
   * Applies a fresh summary without losing a selection that still exists. A removed course or exercise falls back to
   * the scope default and clears the page offsets that belonged to it.
   */
  #applySummary(dashboard: InsightsDashboard) {
    const selectedCourseId = this.selection.courseId;
    const courseStillExists =
      selectedCourseId === null || dashboard.scope.courses.some((course) => course.id === selectedCourseId);

    this.dashboard = dashboard;

    if (!courseStillExists) {
      this.selection.courseId = defaultCourseId(dashboard);
      this.selection.exerciseId = this.#defaultExercise(dashboard);
      this.selection.pages = {};
    } else if (this.selection.exerciseId && selectedCourseId) {
      const items = dashboard.structures[selectedCourseId]?.items ?? [];

      if (!items.some((item) => item.id === this.selection.exerciseId)) {
        this.selection.exerciseId = this.#defaultExercise(dashboard);
      }
    }

    this.selection.breakdown = activeBreakdownGroup(
      this.selection,
      availableBreakdownGroups(dashboard.scope.type, dashboard.scope)
    );

    if (dashboard.scope.cohortCount === 0) {
      this.selection.cohortIds = null;
    }
  }

  /**
   * The scores chart defaults to the newest cohorts, which it reads from the picker's list. Load the list up front
   * so that default never depends on another widget's page.
   */
  async #preloadCohortOptions() {
    if (this.cohortCount <= 1) return;

    await this.loadCohortOptions();
  }

  async #refreshCohortOptionsIfNeeded(options: { refresh?: boolean }) {
    if (!this.cohortOptionsHasLoaded) return;
    if (!options.refresh && !this.cohortOptionsOpen) return;

    await this.#loadCohortOptionsPage(1, false, Boolean(options.refresh));
  }

  reset() {
    this.#dashboardSeq += 1;
    this.#resetView(null);
  }

  /**
   * Runs a spec in this dashboard's scope, sharing the request with any identical one in flight.
   */
  sharedQuery(spec: InsightsSpec, options: { refresh?: boolean } = {}): Promise<InsightsResult | null> {
    const scope = this.scope;
    if (!scope) return Promise.resolve(null);

    const refresh = Boolean(options.refresh);
    const key = specRequestKey(scope, spec, refresh);
    const pending = this.#inFlight.get(key);
    if (pending) return pending;

    const request = this.#query(scope, spec, refresh);
    const clearRequest = () => {
      if (this.#inFlight.get(key) === request) this.#inFlight.delete(key);
    };
    this.#inFlight.set(key, request);
    void request.then(clearRequest, clearRequest);

    return request;
  }

  async #query(scope: InsightsScopeRef, spec: InsightsSpec, refresh: boolean): Promise<InsightsResult | null> {
    const response = await this.execute<InsightsQueryRequest>({
      requestFn: () => classroomio.insights.query.$post({ json: { scope, spec, refresh } }),
      logContext: `loading insights ${spec.source}`
    });

    return response?.data ?? null;
  }

  #resetView(scope: InsightsScopeRef | null) {
    this.scope = scope;
    this.dashboard = null;
    this.dashboardFailed = false;
    this.widgetStates = {};
    this.selection.courseId = null;
    this.selection.exerciseId = null;
    this.selection.breakdown = 'courses';
    this.selection.cohortIds = null;
    this.selection.pages = {};
    this.selection.range = clampRangeToDays(this.selection.range, maxRangeDays());
    this.cohortOptions = [];
    this.cohortOptionsById = {};
    this.cohortOptionsSearch = '';
    this.cohortOptionsMatchTotal = 0;
    this.cohortOptionsLoading = false;
    this.cohortOptionsFailed = false;
    this.cohortOptionsHasLoaded = false;
    this.cohortOptionsOpen = false;
    this.#cohortOptionsSeq += 1;
    this.#cohortOptionsPage = 1;
    this.#inFlight.clear();
  }

  #defaultExercise(dashboard: InsightsDashboard): string | null {
    if (dashboard.scope.type !== 'course') return null;

    const courseId = dashboard.scope.courses[0]?.id;

    return courseId ? defaultExerciseId(dashboard.structures[courseId]) : null;
  }
}

export const insightsApi = new InsightsApi();
