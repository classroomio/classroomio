<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import * as Select from '@cio/ui/base/select';
  import { Switch } from '@cio/ui/base/switch';
  import { NumberField } from '@cio/ui/custom/number-field';
  import { UnsavedChanges } from '$features/ui';
  import { snackbar } from '$features/ui/snackbar/store';
  import { activityApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import type { TScormSettings } from '@cio/utils/validation/activity/scorm';

  interface Props {
    courseId: string;
    activityId: string;
    settings: TScormSettings;
    hasPassMark: boolean;
    disabled?: boolean;
    onSaved?: () => void;
  }

  let { courseId, activityId, settings, hasPassMark, disabled = false, onSaved }: Props = $props();

  let loadedActivityId = $state('');
  let rule = $state<TScormSettings['completionRule']>('auto');
  let minScore = $state<number | null>(null);
  let allowRetakes = $state(false);
  let launchMode = $state<TScormSettings['launchMode']>('embedded');
  let saving = $state(false);
  let hasUnsavedChanges = $state(false);

  $effect(() => {
    if (activityId === loadedActivityId) return;

    loadedActivityId = activityId;
    rule = settings.completionRule;
    minScore = settings.minScorePercent ?? null;
    allowRetakes = settings.allowRetakes;
    launchMode = settings.launchMode;
    hasUnsavedChanges = false;
  });

  const dirty = $derived(
    rule !== settings.completionRule ||
      (minScore ?? null) !== (settings.minScorePercent ?? null) ||
      allowRetakes !== settings.allowRetakes ||
      launchMode !== settings.launchMode
  );

  $effect(() => {
    hasUnsavedChanges = dirty && !disabled;
  });

  async function saveSettings() {
    if (!dirty || disabled || saving) return;

    saving = true;
    try {
      await activityApi.updateSettings(courseId, activityId, {
        completionRule: rule,
        minScorePercent: rule === 'score' ? (minScore ?? 80) : null,
        allowRetakes,
        launchMode
      });

      if (activityApi.success) {
        snackbar.success('snackbar.activity.settings_saved');
        hasUnsavedChanges = false;
        onSaved?.();
      }
    } finally {
      saving = false;
    }
  }
</script>

<UnsavedChanges bind:hasUnsavedChanges />

<div data-testid="activity-settings">
  <Field.Group>
    <Field.Set>
      <Field.Field>
        <Field.Label>{$t('course.navItem.lessons.activities.settings.completion_rule')}</Field.Label>
        <Select.Root
          type="single"
          value={rule}
          {disabled}
          onValueChange={(value) => {
            if (value === 'auto' || value === 'completed' || value === 'passed' || value === 'score') {
              rule = value;
            }
          }}
        >
          <Select.Trigger class="w-full">
            {$t(`course.navItem.lessons.activities.settings.rule_${rule}`)}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="auto">{$t('course.navItem.lessons.activities.settings.rule_auto')}</Select.Item>
            <Select.Item value="completed"
              >{$t('course.navItem.lessons.activities.settings.rule_completed')}</Select.Item
            >
            <Select.Item value="passed">{$t('course.navItem.lessons.activities.settings.rule_passed')}</Select.Item>
            <Select.Item value="score">{$t('course.navItem.lessons.activities.settings.rule_score')}</Select.Item>
          </Select.Content>
        </Select.Root>
        <Field.Description>
          {$t('course.navItem.lessons.activities.settings.completion_rule_helper')}
        </Field.Description>
      </Field.Field>

      {#if rule === 'score'}
        <Field.Field>
          <NumberField
            integer
            min={0}
            max={100}
            {disabled}
            label={$t('course.navItem.lessons.activities.settings.min_score')}
            value={minScore ?? 80}
            onValueChange={(next) => {
              minScore = next ?? 80;
            }}
          />
        </Field.Field>
      {/if}

      <p class="ui:text-muted-foreground text-sm">
        {#if hasPassMark}
          {$t('course.navItem.lessons.activities.settings.graded_hint', {
            score: minScore ?? settings.minScorePercent ?? 80
          })}
        {:else}
          {$t('course.navItem.lessons.activities.settings.ungraded_hint')}
        {/if}
      </p>

      {#if rule === 'passed'}
        <p class="text-sm text-amber-700 dark:text-amber-300">
          {$t('course.navItem.lessons.activities.settings.passed_warning')}
        </p>
      {/if}
    </Field.Set>

    <Field.Separator />

    <Field.Set>
      <Field.Field orientation="horizontal">
        <Switch bind:checked={allowRetakes} {disabled} />
        <Field.Label>{$t('course.navItem.lessons.activities.settings.retakes')}</Field.Label>
      </Field.Field>
      <p class="ui:text-muted-foreground text-sm">
        {$t('course.navItem.lessons.activities.settings.retakes_helper')}
      </p>

      <Field.Field>
        <Field.Label>{$t('course.navItem.lessons.activities.settings.launch_mode')}</Field.Label>
        <Select.Root
          type="single"
          value={launchMode}
          {disabled}
          onValueChange={(value) => {
            if (value === 'embedded' || value === 'window') launchMode = value;
          }}
        >
          <Select.Trigger class="w-full">
            {$t(`course.navItem.lessons.activities.settings.launch_${launchMode}`)}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="embedded"
              >{$t('course.navItem.lessons.activities.settings.launch_embedded')}</Select.Item
            >
            <Select.Item value="window">{$t('course.navItem.lessons.activities.settings.launch_window')}</Select.Item>
          </Select.Content>
        </Select.Root>
      </Field.Field>
    </Field.Set>
  </Field.Group>

  <div class="mt-6 flex justify-end">
    <Button onclick={saveSettings} loading={saving} disabled={!dirty || disabled}>
      {$t('course.navItem.lessons.activities.settings.save')}
    </Button>
  </div>
</div>
