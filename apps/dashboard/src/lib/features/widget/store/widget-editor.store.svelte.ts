import { buildWidgetPayload, getDefaultWidgetConfig } from '@cio/utils/validation/widget';
import type { WidgetDetail } from '../utils/types';
import { widgetApi } from '../api/widget.svelte';
import { deepPlain, buildCourseFilterPredicate, type FilterPublished } from '../utils/widget-editor-utils';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { currentOrgPath } from '$lib/utils/store/org';
import { get } from 'svelte/store';

export type PanelId = 'select-courses' | 'layout' | 'design' | 'embed';

class WidgetEditorStore {
  // ── persisted detail (last server-synced) ──────────────────────────────────
  detail = $state<WidgetDetail | null>(null);

  // ── draft fields ───────────────────────────────────────────────────────────
  draftName = $state('');
  draftLayoutType = $state<WidgetDetail['widget']['layoutType']>('card_grid');
  draftSelectionMode = $state<WidgetDetail['widget']['selectionMode']>('manual');
  draftConfig = $state(getDefaultWidgetConfig());
  selectedCourseIds = $state<string[]>([]);

  // ── UI state ───────────────────────────────────────────────────────────────
  saving = $state(false);
  publishing = $state(false);
  activePanel = $state<PanelId>('select-courses');
  editingName = $state(false);
  courseSearch = $state('');
  filterPublished = $state<FilterPublished>('all');
  filterCourseType = $state('all');
  filterTagSlugs = $state<string[]>([]);

  // ── sync guard ─────────────────────────────────────────────────────────────
  #syncedDetailSignature = $state('');

  // ── derived ────────────────────────────────────────────────────────────────
  readonly featuredCourseOptions = $derived.by(() => {
    if (!this.detail) return [];
    const candidateIds =
      this.draftSelectionMode === 'manual'
        ? this.selectedCourseIds
        : this.detail.availableCourses.map((course) => course.id);
    const lookup = new Map(this.detail.availableCourses.map((course) => [course.id, course] as const));
    return candidateIds
      .map((id) => lookup.get(id))
      .filter((course): course is NonNullable<ReturnType<typeof lookup.get>> => Boolean(course))
      .map((course) => ({ id: course.id, title: course.title }));
  });

  readonly tagOptions = $derived(this.detail?.availableTags ?? []);

  readonly layoutValidationError = $derived.by((): string | null => {
    if (!this.detail) return null;
    if (this.draftLayoutType === 'primary_course' && !this.draftConfig.layoutOptions.primaryCourse.featuredCourseId) {
      return 'widgets.layoutOptions.featured_course_required';
    }
    if (
      this.draftLayoutType === 'editorial_spotlight' &&
      !this.draftConfig.layoutOptions.editorialSpotlight.mainCourseId
    ) {
      return 'widgets.layoutOptions.main_course_required';
    }
    if (
      this.draftLayoutType === 'category_shelf' &&
      this.draftSelectionMode === 'published' &&
      this.draftConfig.layoutOptions.categoryShelf.categoryTagIds.length === 0
    ) {
      return 'widgets.layoutOptions.category_tags_required';
    }
    return null;
  });

  readonly filteredCourses = $derived.by(() => {
    if (!this.detail) return [];
    const predicate = buildCourseFilterPredicate({
      courseSearch: this.courseSearch,
      filterPublished: this.filterPublished,
      filterCourseType: this.filterCourseType,
      filterTagSlugs: this.filterTagSlugs
    });
    return this.detail.availableCourses.filter(predicate);
  });

  readonly activeFilterCount = $derived(
    (this.filterPublished !== 'all' ? 1 : 0) + (this.filterCourseType !== 'all' ? 1 : 0) + this.filterTagSlugs.length
  );

  /**
   * Field-keyed validation errors from the last save attempt, keyed by Zod path
   * (e.g. `config.typography.fontSizeScale`). Cleared when the user edits the draft
   * or successfully saves.
   */
  readonly validationErrors = $derived<Record<string, string>>(widgetApi.errors);

  readonly previewPayload = $derived.by(() => {
    if (!this.detail) return null;
    try {
      return buildWidgetPayload({
        widget: {
          id: this.detail.widget.id,
          publicKey: this.detail.widget.publicKey,
          layoutType: this.draftLayoutType,
          selectionMode: this.draftSelectionMode,
          config: deepPlain(this.draftConfig)
        },
        organization: this.detail.organization,
        orgBaseUrl: this.detail.orgBaseUrl,
        allCourses: this.detail.availableCourses,
        selectedCourseIds: [...this.selectedCourseIds],
        planGatedFields: this.detail.planGatedFields,
        planName: this.detail.planName
      });
    } catch (error) {
      console.warn('Failed to build widget preview payload:', error);
      return null;
    }
  });

  readonly isDirty = $derived(
    this.detail !== null &&
      JSON.stringify({
        name: this.draftName,
        layoutType: this.draftLayoutType,
        selectionMode: this.draftSelectionMode,
        config: this.draftConfig,
        selectedCourseIds: this.selectedCourseIds
      }) !==
        JSON.stringify({
          name: this.detail.widget.name,
          layoutType: this.detail.widget.layoutType,
          selectionMode: this.detail.widget.selectionMode,
          config: this.detail.widget.config,
          selectedCourseIds: this.detail.widget.selectedCourseIds
        })
  );

  // ── public mutations ───────────────────────────────────────────────────────

  applyDetail(nextDetail: WidgetDetail) {
    this.detail = nextDetail;
    this.draftName = nextDetail.widget.name;
    this.draftLayoutType = nextDetail.widget.layoutType;
    this.draftSelectionMode = nextDetail.widget.selectionMode;
    this.draftConfig = deepPlain(nextDetail.widget.config);
    this.selectedCourseIds = [...nextDetail.widget.selectedCourseIds];
  }

  syncFromInitial(initialDetail: WidgetDetail) {
    const nextSignature = [
      initialDetail.widget.id,
      initialDetail.widget.updatedAt,
      initialDetail.widget.latestPublishedVersionId ?? ''
    ].join(':');

    if (this.#syncedDetailSignature === nextSignature) return;

    this.#syncedDetailSignature = nextSignature;
    this.applyDetail(initialDetail);
  }

  resetDraft() {
    if (!this.detail) return;
    this.applyDetail(this.detail);
  }

  clearFilters() {
    this.filterPublished = 'all';
    this.filterCourseType = 'all';
    this.filterTagSlugs = [];
  }

  toggleCategoryTag(tagId: string, checked: boolean) {
    const current = this.draftConfig.layoutOptions.categoryShelf.categoryTagIds;
    this.draftConfig.layoutOptions.categoryShelf.categoryTagIds = checked
      ? [...current, tagId]
      : current.filter((id) => id !== tagId);
    if (!checked && this.draftConfig.layoutOptions.categoryShelf.defaultCategoryTagId === tagId) {
      this.draftConfig.layoutOptions.categoryShelf.defaultCategoryTagId = null;
    }
  }

  async saveWidget(silent = false): Promise<boolean> {
    if (!this.detail) return false;

    this.saving = true;
    widgetApi.resetErrors();

    try {
      const updatedWidget = await widgetApi.updateWidget(
        this.detail.widget.id,
        {
          name: this.draftName,
          layoutType: this.draftLayoutType,
          selectionMode: this.draftSelectionMode,
          config: this.draftConfig,
          selectedCourseIds: this.selectedCourseIds
        },
        silent
      );

      if (!updatedWidget) return false;

      await widgetApi.getWidget(this.detail.widget.id);
      if (widgetApi.widgetDetail) {
        this.applyDetail(widgetApi.widgetDetail);
      }

      return true;
    } finally {
      this.saving = false;
    }
  }

  async publishWidget() {
    this.publishing = true;
    try {
      const saved = await this.saveWidget(true);
      if (!saved || !this.detail) return;

      const published = await widgetApi.publishWidget(this.detail.widget.id);
      if (!published) return;

      await widgetApi.getWidget(this.detail.widget.id);
      if (widgetApi.widgetDetail) {
        this.applyDetail(widgetApi.widgetDetail);
      }

      this.activePanel = 'embed';
    } finally {
      this.publishing = false;
    }
  }

  async rollback(versionId: string) {
    if (!this.detail) return;

    await widgetApi.rollbackWidget(this.detail.widget.id, versionId);
    await widgetApi.getWidget(this.detail.widget.id);
    if (widgetApi.widgetDetail) {
      this.applyDetail(widgetApi.widgetDetail);
    }
  }

  async deleteWidget() {
    if (!this.detail) return;

    await widgetApi.deleteWidget(this.detail.widget.id);
    goto(resolve(`${get(currentOrgPath)}/widgets`, {}));
  }
}

export const widgetEditorStore = new WidgetEditorStore();
