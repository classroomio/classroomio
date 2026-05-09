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

  type Props = {
    exerciseId: string;
  };

  let { exerciseId }: Props = $props();

  let saving = $state(false);
  let slug = $state($questionnaire.slug ?? '');

  $effect(() => {
    slug = $questionnaire.slug ?? '';
  });

  const isPublicCourse = $derived(courseApi.course?.type === 'PUBLIC');

  async function saveSettings() {
    if (!courseApi.course?.id) return;
    saving = true;

    await exerciseApi.update(courseApi.course.id, exerciseId, {
      allowMultipleAttempts: !!$questionnaire.allowMultipleAttempts,
      slug: isPublicCourse && slug ? slug : undefined
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
