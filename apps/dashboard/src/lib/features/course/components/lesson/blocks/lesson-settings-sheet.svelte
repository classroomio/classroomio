<script lang="ts">
  import * as Sheet from '@cio/ui/base/sheet';
  import * as Field from '@cio/ui/base/field';
  import { DensityControl, type DensityControlValue } from '@cio/ui';
  import { t } from '$lib/utils/functions/translations';
  import LessonSettingsTab from '../lesson-settings-tab.svelte';
  import { lessonApi } from '$features/course/api';
  import { DEFAULT_READING_DENSITY, LESSON_READING_DENSITY_OPTIONS } from '$features/course/utils/lesson-blocks';

  interface Props {
    open?: boolean;
    hasUnsavedSessionChanges?: boolean;
  }

  let { open = $bindable(false), hasUnsavedSessionChanges = $bindable(false) }: Props = $props();

  const densityOptions = $derived(
    LESSON_READING_DENSITY_OPTIONS.map((option) => ({ value: option.value, label: t.get(option.labelKey) }))
  );
  const readingDensity = $derived(lessonApi.lesson?.readingDensity ?? DEFAULT_READING_DENSITY);
</script>

<Sheet.Root bind:open>
  <Sheet.Content side="right" class="w-full gap-0 overflow-y-auto pb-10 sm:max-w-md">
    <Sheet.Header>
      <Sheet.Title>{$t('course.navItem.lessons.materials.blocks.settings.title')}</Sheet.Title>
      <Sheet.Description>{$t('course.navItem.lessons.materials.blocks.settings.description')}</Sheet.Description>
    </Sheet.Header>

    <LessonSettingsTab bind:hasUnsavedSessionChanges />

    <div class="border-b p-4">
      <Field.Group class="w-full">
        <Field.Set>
          <Field.Legend>{$t('course.navItem.lessons.materials.blocks.reading_density.title')}</Field.Legend>
          <Field.Description>
            {$t('course.navItem.lessons.materials.blocks.reading_density.description')}
          </Field.Description>

          <Field.Field>
            <DensityControl
              value={readingDensity}
              options={densityOptions}
              groupLabel={t.get('course.navItem.lessons.materials.blocks.reading_density.title')}
              testIdPrefix="lesson-density"
              onChange={(value: DensityControlValue) => lessonApi.updateLessonState('readingDensity', value)}
            />
          </Field.Field>
        </Field.Set>
      </Field.Group>
    </div>
  </Sheet.Content>
</Sheet.Root>
