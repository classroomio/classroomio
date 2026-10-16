<script lang="ts">
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
    passMark?: number | null;
    moduleCount?: number;
    disabled?: boolean;
    dirty?: boolean;
    saving?: boolean;
    onSaved?: () => void;
  }

  let {
    courseId,
    activityId,
    settings,
    hasPassMark,
    passMark = null,
    moduleCount = 0,
    disabled = false,
    dirty = $bindable(false),
    saving = $bindable(false),
    onSaved
  }: Props = $props();

  let loadedActivityId = $state('');
  let rule = $state<TScormSettings['completionRule']>('auto');
  let minScore = $state<number | null>(null);
  let allowRetakes = $state(false);
  let moduleOrder = $state<TScormSettings['moduleOrder']>('free');
  let completionModules = $state<TScormSettings['completionModules']>('all');
  let hasUnsavedChanges = $state(false);

  $effect(() => {
    if (activityId === loadedActivityId) return;

    loadedActivityId = activityId;
    rule = settings.completionRule;
    minScore = settings.minScorePercent ?? null;
    allowRetakes = settings.allowRetakes;
    moduleOrder = settings.moduleOrder;
    completionModules = settings.completionModules;
    hasUnsavedChanges = false;
  });

  const formDirty = $derived(
    rule !== settings.completionRule ||
      (minScore ?? null) !== (settings.minScorePercent ?? null) ||
      allowRetakes !== settings.allowRetakes ||
      moduleOrder !== settings.moduleOrder ||
      completionModules !== settings.completionModules
  );

  $effect(() => {
    hasUnsavedChanges = formDirty && !disabled;
    dirty = formDirty && !disabled;
  });

  async function saveSettings() {
    if (!formDirty || disabled || saving) return;

    saving = true;
    try {
      await activityApi.updateSettings(courseId, activityId, {
        completionRule: rule,
        minScorePercent: rule === 'score' ? (minScore ?? 80) : null,
        allowRetakes,
        moduleOrder,
        completionModules
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

  export function save(): Promise<void> {
    return saveSettings();
  }

  export function discard(): void {
    rule = settings.completionRule;
    minScore = settings.minScorePercent ?? null;
    allowRetakes = settings.allowRetakes;
    moduleOrder = settings.moduleOrder;
    completionModules = settings.completionModules;
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
            isDisabled={disabled}
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
            score: passMark ?? minScore ?? settings.minScorePercent ?? 80
          })}
        {:else if rule === 'score'}
          {$t('course.navItem.lessons.activities.settings.custom_threshold_hint', {
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

      <Field.Field>
        <Field.Label>{$t('course.navItem.lessons.activities.settings.completion_modules')}</Field.Label>
        <Select.Root
          type="single"
          value={completionModules}
          disabled={disabled || moduleCount <= 1}
          onValueChange={(value) => {
            if (value === 'all' || value === 'graded_only') {
              completionModules = value;
            }
          }}
        >
          <Select.Trigger class="w-full">
            {$t(`course.navItem.lessons.activities.settings.completion_modules_${completionModules}`)}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all"
              >{$t('course.navItem.lessons.activities.settings.completion_modules_all')}</Select.Item
            >
            <Select.Item value="graded_only"
              >{$t('course.navItem.lessons.activities.settings.completion_modules_graded_only')}</Select.Item
            >
          </Select.Content>
        </Select.Root>
        <Field.Description>
          {#if moduleCount <= 1}
            {$t('course.navItem.lessons.activities.settings.completion_modules_single_note')}
          {:else}
            {$t('course.navItem.lessons.activities.settings.completion_modules_helper')}
          {/if}
        </Field.Description>
      </Field.Field>
    </Field.Set>

    <Field.Separator />

    <Field.Set>
      <Field.Field orientation="horizontal">
        <Switch id="activity-settings-retakes" bind:checked={allowRetakes} {disabled} />
        <Field.Label for="activity-settings-retakes"
          >{$t('course.navItem.lessons.activities.settings.retakes')}</Field.Label
        >
      </Field.Field>
      <p class="ui:text-muted-foreground text-sm">
        {$t('course.navItem.lessons.activities.settings.retakes_helper')}
      </p>

      <Field.Field>
        <Field.Label>{$t('course.navItem.lessons.activities.settings.module_order')}</Field.Label>
        <Select.Root
          type="single"
          value={moduleOrder}
          {disabled}
          onValueChange={(value) => {
            if (value === 'free' || value === 'sequential') {
              moduleOrder = value;
            }
          }}
        >
          <Select.Trigger class="w-full">
            {$t(`course.navItem.lessons.activities.settings.order_${moduleOrder}`)}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="free">{$t('course.navItem.lessons.activities.settings.order_free')}</Select.Item>
            <Select.Item value="sequential"
              >{$t('course.navItem.lessons.activities.settings.order_sequential')}</Select.Item
            >
          </Select.Content>
        </Select.Root>
        <Field.Description>
          {$t('course.navItem.lessons.activities.settings.module_order_helper')}
        </Field.Description>
      </Field.Field>
    </Field.Set>
  </Field.Group>
</div>
