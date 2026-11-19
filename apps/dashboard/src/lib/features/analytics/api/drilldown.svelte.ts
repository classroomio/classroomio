import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { resolveWidgetSpec, studentsTableSpec, widgetDrilldown, type AnalyticsDrilldown } from '@cio/utils/analytics';
import { ANALYTICS_LIMITS } from '@cio/utils/constants/analytics';

import { pageAfterEmptyResult, STUDENTS_TABLE_ANCHOR, studentsTabTarget } from '../utils/analytics-utils';
import type { AnalyticsRow, AnalyticsWidget } from '../utils/types';
import { analyticsApi } from './analytics.svelte';
import { analyticsStudentsApi } from './students.svelte';

class AnalyticsDrilldownApi {
  isOpen = $state(false);
  drilldown = $state<AnalyticsDrilldown | null>(null);
  rows = $state<AnalyticsRow[]>([]);
  total = $state(0);
  page = $state(1);
  isLoading = $state(false);
  hasLoaded = $state(false);
  failed = $state(false);

  #seq = 0;

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.total / ANALYTICS_LIMITS.studentsPageSize));
  }

  studentsTabFor(drilldown: AnalyticsDrilldown) {
    const scope = analyticsApi.scope;
    if (!scope) return null;

    return studentsTabTarget(drilldown, scope);
  }

  /**
   * The drill-down a widget offers for a clicked segment, or for the whole widget when no segment is given.
   * Null when the widget has no exact student list for it, or its result has not loaded.
   */
  forWidget(widget: AnalyticsWidget, segmentKey: string | null): AnalyticsDrilldown | null {
    const spec = resolveWidgetSpec(widget, analyticsApi.selection);
    const result = analyticsApi.widgetResult(widget.id);
    if (!spec || !result) return null;

    return widgetDrilldown({ widgetId: widget.id, spec, rows: result.rows, segmentKey });
  }

  async openForWidget(widget: AnalyticsWidget, segmentKey: string | null) {
    const drilldown = this.forWidget(widget, segmentKey);
    if (!drilldown) return;

    await this.open(drilldown);
  }

  async open(drilldown: AnalyticsDrilldown) {
    this.drilldown = drilldown;
    this.isOpen = true;
    this.rows = [];
    this.total = 0;
    this.page = 1;
    this.hasLoaded = false;

    await this.#load();
  }

  async goToPage(page: number) {
    if (page === this.page || page < 1 || page > this.pageCount) return;

    this.page = page;

    await this.#load();
  }

  retry() {
    return this.#load();
  }

  close() {
    this.isOpen = false;
  }

  async openInStudentsTab(drilldown: AnalyticsDrilldown) {
    const target = this.studentsTabFor(drilldown);
    if (!target) return;

    this.close();
    void analyticsStudentsApi.applyFilters(target);
    await goto(resolve(target.href, {}), { noScroll: true, keepFocus: true });

    document.getElementById(STUDENTS_TABLE_ANCHOR)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async #load() {
    const drilldown = this.drilldown;
    if (!drilldown) return;

    this.#seq += 1;
    const seq = this.#seq;
    this.isLoading = true;
    this.failed = false;

    const spec = studentsTableSpec({
      filters: drilldown.filters,
      range: drilldown.range,
      page: this.page,
      limit: ANALYTICS_LIMITS.studentsPageSize
    });
    const result = await analyticsApi.sharedQuery(spec);
    if (seq !== this.#seq) return;

    this.isLoading = false;
    this.hasLoaded = true;

    if (!result) {
      this.failed = true;
      return;
    }

    if (result.rows.length === 0 && this.page > 1) {
      this.page = pageAfterEmptyResult(this.page, result.total, ANALYTICS_LIMITS.studentsPageSize);
      await this.#load();
      return;
    }

    this.rows = result.rows;
    this.total = result.total;
  }

  reset() {
    this.#seq += 1;
    this.isOpen = false;
    this.drilldown = null;
    this.rows = [];
    this.total = 0;
    this.page = 1;
    this.isLoading = false;
    this.hasLoaded = false;
    this.failed = false;
  }
}

export const analyticsDrilldownApi = new AnalyticsDrilldownApi();
