<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import * as Select from '@cio/ui/base/select';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Search } from '@cio/ui/custom/search';
  import { CheckboxOptionCardGroup, type CheckboxOptionCardOption } from '@cio/ui/custom/checkbox-option-card';
  import { CourseTagsOverflow } from '$features/course/components';
  import CourseFilterPopover from '../components/course-filter-popover.svelte';
  import { t } from '$lib/utils/functions/translations';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import type { WidgetDetail } from '../utils/types';
  import type { FilterPublished } from '../utils/widget-editor-utils';

  interface Props {
    detail: WidgetDetail;
    draftSelectionMode: WidgetDetail['widget']['selectionMode'];
    selectedCourseIds: string[];
    courseSearch: string;
    filterPublished: FilterPublished;
    filterCourseType: string;
    filterTagSlugs: string[];
    filteredCourses: WidgetDetail['availableCourses'];
    activeFilterCount: number;
    onContinueToLayout: () => void;
    onClearFilters: () => void;
  }

  let {
    detail,
    draftSelectionMode = $bindable(),
    selectedCourseIds = $bindable(),
    courseSearch = $bindable(),
    filterPublished = $bindable(),
    filterCourseType = $bindable(),
    filterTagSlugs = $bindable(),
    filteredCourses,
    activeFilterCount,
    onContinueToLayout,
    onClearFilters
  }: Props = $props();

  const courseTypeLabels = $derived<Record<string, string>>({
    LIVE_CLASS: $t('new_course_modal.live_class_label'),
    SELF_PACED: $t('new_course_modal.self_paced_label'),
    COMPLIANCE: $t('new_course_modal.compliance_label')
  });

  const courseTypeOptions = $derived([
    { value: 'LIVE_CLASS', label: $t('new_course_modal.live_class_label') },
    { value: 'SELF_PACED', label: $t('new_course_modal.self_paced_label') },
    { value: 'COMPLIANCE', label: $t('new_course_modal.compliance_label') }
  ]);

  const courseOptions = $derived<CheckboxOptionCardOption[]>(
    filteredCourses.map((course) => ({
      id: course.id,
      title: course.title,
      value: course.id
    }))
  );
</script>

<div class="space-y-4">
  <Button type="button" class="ui:justify-between w-full" onclick={onContinueToLayout}>
    {$t('widgets.editor.continue_to_layout')}
    <ChevronRightIcon class="size-4" />
  </Button>

  <Field.Group>
    <Field.Set>
      <Field.Legend>{$t('widgets.editor.sources')}</Field.Legend>
      <Field.Field>
        <Field.Label>{$t('widgets.form.selection_mode')}</Field.Label>
        <Select.Root type="single" bind:value={draftSelectionMode}>
          <Select.Trigger>
            {draftSelectionMode === 'manual' ? $t('widgets.selection.manual') : $t('widgets.selection.published')}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="manual">{$t('widgets.selection.manual')}</Select.Item>
            <Select.Item value="published">{$t('widgets.selection.published')}</Select.Item>
          </Select.Content>
        </Select.Root>
      </Field.Field>
    </Field.Set>

    <Field.Separator />

    <Field.Set>
      <Field.Legend>{$t('widgets.editor.available_courses')}</Field.Legend>
      <div class="flex items-center gap-2">
        <Search class="ui:max-w-none flex-1" placeholder={$t('widgets.form.course_search')} bind:value={courseSearch} />
        <CourseFilterPopover
          {activeFilterCount}
          {filterPublished}
          {filterCourseType}
          {filterTagSlugs}
          availableTags={detail.availableTags}
          {courseTypeOptions}
          onClearAll={onClearFilters}
          onFilterPublishedChange={(val) => (filterPublished = val)}
          onFilterCourseTypeChange={(val) => (filterCourseType = val)}
          onFilterTagSlugsChange={(slugs) => (filterTagSlugs = slugs)}
        />
      </div>

      {#if courseOptions.length === 0}
        <p class="ui:text-muted-foreground px-1 py-6 text-center text-xs">
          {$t('widgets.preview.empty')}
        </p>
      {:else}
        <CheckboxOptionCardGroup options={courseOptions} bind:value={selectedCourseIds} class="ui:grid-cols-1">
          {#snippet titleSuffix(option)}
            {@const course = filteredCourses.find((entry) => entry.id === option.id)}
            {#if course?.courseType && courseTypeLabels[course.courseType]}
              <Badge variant="outline" class="shrink-0 text-[10px]">{courseTypeLabels[course.courseType]}</Badge>
            {/if}
          {/snippet}
          {#snippet footer(option)}
            {@const course = filteredCourses.find((entry) => entry.id === option.id)}
            {#if course}
              <div class="space-y-1.5">
                <div class="ui:text-muted-foreground flex items-center gap-2 text-xs">
                  {#if course.isPublished}
                    <span class="inline-flex items-center gap-1 font-medium text-emerald-600">
                      <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      {$t('widgets.status.live')}
                    </span>
                  {:else}
                    <span class="ui:text-muted-foreground inline-flex items-center gap-1">
                      <span class="ui:bg-muted-foreground/50 h-1.5 w-1.5 rounded-full"></span>
                      {$t('widgets.filter.unpublished')}
                    </span>
                  {/if}
                  <span class="ui:text-muted-foreground/50">·</span>
                  <span>{course.lessonCount} {$t('widgets.preview.lessons_suffix')}</span>
                  {#if course.exerciseCount > 0}
                    <span class="ui:text-muted-foreground/50">·</span>
                    <span>{course.exerciseCount} {$t('widgets.preview.exercises_suffix')}</span>
                  {/if}
                </div>
                {#if course.tags.length > 0}
                  <CourseTagsOverflow tags={course.tags} variant="card" />
                {/if}
              </div>
            {/if}
          {/snippet}
        </CheckboxOptionCardGroup>
      {/if}
    </Field.Set>
  </Field.Group>
</div>
