<script lang="ts">
  import { Switch } from '@cio/ui/base/switch';
  import { Label } from '@cio/ui/base/label';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { questionnaire } from './store';
  import { exerciseApi } from '$features/course/api';
  import { courseApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { slugifyTitle } from '@cio/utils/validation';
  import * as Select from '@cio/ui/base/select';

  type Props = {
    exerciseId: string;
    onBeforeSave?: () => Promise<boolean> | boolean;
    totalSubmissions?: number;
  };

  let { exerciseId, onBeforeSave = () => true, totalSubmissions = 0 }: Props = $props();

  let saving = $state(false);
  let slug = $state($questionnaire.slug ?? '');

  $effect(() => {
    slug = $questionnaire.slug ?? '';
  });

  const isPublicCourse = $derived(courseApi.course?.type === 'PUBLIC');

  async function saveSettings() {
    if (!courseApi.course?.id) return;
    const canSave = await onBeforeSave();
    if (!canSave) return;

    saving = true;

    const allowMultipleAttempts = !!$questionnaire.allowMultipleAttempts;
    const completionPolicy = $questionnaire.completionPolicy ?? 'submitted';
    const passThreshold = $questionnaire.passThreshold ?? 100;
    const slugPayload = isPublicCourse && slug ? slug : undefined;

    await exerciseApi.update(courseApi.course.id, exerciseId, {
      allowMultipleAttempts,
      completionPolicy,
      passThreshold,
      slug: slugPayload
    });
    saving = false;

    if (exerciseApi.success) {
      snackbar.success('snackbar.exercise.success');
    }
  }
</script>

<div class="max-w-xl space-y-6">
  <div class="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
    <div class="space-y-1">
      <Label for="allow-multiple" class="text-sm font-medium dark:text-gray-100">
        {$t('course.navItem.lessons.exercises.all_exercises.settings_allow_multiple')}
      </Label>
      <p class="ui:text-muted-foreground text-sm">
        {$t('course.navItem.lessons.exercises.all_exercises.settings_allow_multiple_helper')}
      </p>
    </div>
    <Switch
      id="allow-multiple"
      checked={!!$questionnaire.allowMultipleAttempts}
      onCheckedChange={(checked) => {
        questionnaire.update((q) => ({ ...q, allowMultipleAttempts: checked }));
      }}
    />
  </div>

  <div class="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
    <Label class="mb-2 block text-sm font-medium dark:text-gray-100">
      {$t('course.navItem.lessons.exercises.all_exercises.settings_completion_policy')}
    </Label>
    <Select.Root
      type="single"
      value={$questionnaire.completionPolicy ?? 'submitted'}
      onValueChange={(value) => {
        if (value === 'submitted' || value === 'passed') {
          questionnaire.update((state) => ({ ...state, completionPolicy: value }));
        }
      }}
    >
      <Select.Trigger class="w-full">
        {($questionnaire.completionPolicy ?? 'submitted') === 'passed'
          ? $t('course.navItem.lessons.exercises.all_exercises.settings_completion_passed')
          : $t('course.navItem.lessons.exercises.all_exercises.settings_completion_submitted')}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="submitted">
          {$t('course.navItem.lessons.exercises.all_exercises.settings_completion_submitted')}
        </Select.Item>
        <Select.Item value="passed">
          {$t('course.navItem.lessons.exercises.all_exercises.settings_completion_passed')}
        </Select.Item>
      </Select.Content>
    </Select.Root>

    {#if ($questionnaire.completionPolicy ?? 'submitted') === 'passed'}
      <div class="mt-4 space-y-3">
        <div class="space-y-2 text-sm">
          <p class="ui:text-muted-foreground">
            {$t('course.navItem.lessons.exercises.all_exercises.settings_completion_passed_helper')}
          </p>
          <p class="text-amber-700 dark:text-amber-300">
            {$t('course.navItem.lessons.exercises.all_exercises.settings_manual_grading_warning')}
          </p>
          {#if !$questionnaire.allowMultipleAttempts}
            <p class="text-amber-700 dark:text-amber-300">
              {$t('course.navItem.lessons.exercises.all_exercises.settings_single_attempt_warning')}
            </p>
          {/if}
          {#if totalSubmissions > 0}
            <p class="text-amber-700 dark:text-amber-300">
              {$t('course.navItem.lessons.exercises.all_exercises.settings_existing_submissions_warning')}
            </p>
          {/if}
        </div>
        <InputField
          type="number"
          label={$t('course.navItem.lessons.exercises.all_exercises.settings_pass_threshold')}
          value={String($questionnaire.passThreshold ?? 100)}
          onInputChange={(event) => {
            const parsed = Number(event.currentTarget.value);
            if (!Number.isNaN(parsed)) {
              questionnaire.update((state) => ({ ...state, passThreshold: parsed }));
            }
          }}
        />
      </div>
    {/if}
  </div>

  {#if isPublicCourse}
    <div class="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
      <InputField
        label={$t('course.navItem.settings.slug.label')}
        helperMessage={$t('course.navItem.settings.slug.description')}
        value={slug}
        placeholder={slugifyTitle($questionnaire.title ?? '')}
        onInputChange={(e) => {
          slug = e.currentTarget.value;
        }}
        errorMessage={exerciseApi.errors.slug}
      />
    </div>
  {/if}

  <Button onclick={saveSettings} loading={saving} disabled={!courseApi.course?.id}>
    {$t('course.navItem.lessons.exercises.all_exercises.settings_save')}
  </Button>
</div>
