<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Label } from '@cio/ui/base/label';
  import * as Select from '@cio/ui/base/select';
  import { Switch } from '@cio/ui/base/switch';
  import { NumberField } from '@cio/ui/custom/number-field';
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
    hasPackage?: boolean;
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
    hasPackage = false,
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

  $effect(() => {
    if (activityId !== loadedActivityId) {
      loadedActivityId = activityId;
      rule = settings.completionRule;
      minScore = settings.minScorePercent ?? null;
      allowRetakes = settings.allowRetakes;
      moduleOrder = settings.moduleOrder;
      completionModules = settings.completionModules;
    } else if (!formDirty) {
      rule = settings.completionRule;
      minScore = settings.minScorePercent ?? null;
      allowRetakes = settings.allowRetakes;
      moduleOrder = settings.moduleOrder;
      completionModules = settings.completionModules;
    }
  });

  const formDirty = $derived(
    rule !== settings.completionRule ||
      (minScore ?? null) !== (settings.minScorePercent ?? null) ||
      allowRetakes !== settings.allowRetakes ||
      moduleOrder !== settings.moduleOrder ||
      completionModules !== settings.completionModules
  );

  $effect(() => {
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

<div data-testid="activity-settings" class="max-w-xl space-y-6">
  <div class="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
    <div class="space-y-1">
      <Label for="activity-settings-retakes" class="text-sm font-medium dark:text-gray-100">
        {$t('course.navItem.lessons.activities.settings.retakes')}
      </Label>
      <p class="ui:text-muted-foreground text-sm">
        {$t('course.navItem.lessons.activities.settings.retakes_helper')}
      </p>
    </div>
    <Switch id="activity-settings-retakes" bind:checked={allowRetakes} {disabled} />
  </div>

  <div class="space-y-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
    <div>
      <Label class="mb-2 block text-sm font-medium dark:text-gray-100">
        {$t('course.navItem.lessons.activities.settings.completion_rule')}
      </Label>
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
          <Select.Item value="completed">{$t('course.navItem.lessons.activities.settings.rule_completed')}</Select.Item>
          <Select.Item value="passed">{$t('course.navItem.lessons.activities.settings.rule_passed')}</Select.Item>
          <Select.Item value="score">{$t('course.navItem.lessons.activities.settings.rule_score')}</Select.Item>
        </Select.Content>
      </Select.Root>
      <p class="ui:text-muted-foreground mt-2 text-sm">
        {$t('course.navItem.lessons.activities.settings.completion_rule_helper')}
      </p>

      {#if rule === 'score'}
        <div class="mt-4">
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
        </div>
      {/if}

      {#if rule === 'auto'}
        <p class="ui:text-muted-foreground mt-3 text-sm">
          {#if !hasPackage}
            {$t('course.navItem.lessons.activities.settings.rule_auto_no_package_hint')}
          {:else if hasPassMark}
            {$t('course.navItem.lessons.activities.settings.graded_hint', {
              score: passMark ?? 80
            })}
          {:else}
            {$t('course.navItem.lessons.activities.settings.ungraded_hint')}
          {/if}
        </p>
      {:else if rule === 'completed'}
        <p class="ui:text-muted-foreground mt-3 text-sm">
          {$t('course.navItem.lessons.activities.settings.rule_completed_hint')}
        </p>
      {:else if rule === 'score'}
        <p class="ui:text-muted-foreground mt-3 text-sm">
          {$t('course.navItem.lessons.activities.settings.rule_score_hint', {
            score: minScore ?? settings.minScorePercent ?? 80
          })}
        </p>
      {:else if rule === 'passed'}
        <p class="mt-3 text-sm text-amber-700 dark:text-amber-300">
          {$t('course.navItem.lessons.activities.settings.passed_warning')}
        </p>
      {/if}
    </div>

    <div class="border-t border-neutral-200 dark:border-neutral-700"></div>

    <div>
      <Label class="mb-2 block text-sm font-medium dark:text-gray-100">
        {$t('course.navItem.lessons.activities.settings.completion_modules')}
      </Label>
      <Select.Root
        type="single"
        value={completionModules}
        disabled={disabled || !hasPackage || moduleCount <= 1}
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
          <Select.Item value="graded_only">
            {$t('course.navItem.lessons.activities.settings.completion_modules_graded_only')}
          </Select.Item>
        </Select.Content>
      </Select.Root>
      <p class="ui:text-muted-foreground mt-2 text-sm">
        {#if !hasPackage}
          {$t('course.navItem.lessons.activities.settings.completion_modules_no_package_note')}
        {:else if moduleCount <= 1}
          {$t('course.navItem.lessons.activities.settings.completion_modules_single_note')}
        {:else}
          {$t('course.navItem.lessons.activities.settings.completion_modules_helper')}
        {/if}
      </p>
    </div>

    <div class="border-t border-neutral-200 dark:border-neutral-700"></div>

    <div>
      <Label class="mb-2 block text-sm font-medium dark:text-gray-100">
        {$t('course.navItem.lessons.activities.settings.module_order')}
      </Label>
      <Select.Root
        type="single"
        value={moduleOrder}
        disabled={disabled || !hasPackage || moduleCount <= 1}
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
      <p class="ui:text-muted-foreground mt-2 text-sm">
        {$t('course.navItem.lessons.activities.settings.module_order_helper')}
      </p>
    </div>
  </div>

  <Button onclick={saveSettings} loading={saving} disabled={!formDirty || disabled}>
    {$t('course.navItem.lessons.exercises.all_exercises.settings_save')}
  </Button>
</div>
