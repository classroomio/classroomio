<script lang="ts">
  import { untrack } from 'svelte';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Label } from '@cio/ui/base/label';
  import * as Select from '@cio/ui/base/select';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import {
    COHORT_GOAL_DEADLINE_KINDS,
    COHORT_GOAL_TYPES,
    type TCreateCohortGoal,
    type TUpdateCohortGoal
  } from '@cio/utils/validation/cohort';
  import { t } from '$lib/utils/functions/translations';
  import { cohortApi, cohortGoalApi } from '$features/cohort/api';
  import type { CohortGoal } from '$features/cohort/utils/types';

  type GoalType = (typeof COHORT_GOAL_TYPES)[number];
  type DeadlineKind = (typeof COHORT_GOAL_DEADLINE_KINDS)[number];

  interface Props {
    open: boolean;
    cohortId: string;
    goal: CohortGoal | null;
    onClose: () => void;
  }

  let { open = $bindable(), cohortId, goal, onClose }: Props = $props();

  let title = $state('');
  let description = $state('');
  let type = $state<GoalType>('complete_all');
  let courseIds = $state<string[]>([]);
  let requiredCount = $state<number | null>(null);
  let scoreThreshold = $state<number | null>(80);
  let teamPassRateThreshold = $state<number | null>(80);
  let deadlineKind = $state<DeadlineKind>('none');
  let deadlineDate = $state('');
  let relativeDays = $state<number | null>(null);
  let recurringMonths = $state<number | null>(null);
  let reminderDaysBeforeText = $state('7, 1');
  let isSaving = $state(false);
  let formError = $state<string | null>(null);

  const isEditing = $derived(goal !== null);
  const availableCourses = $derived(cohortApi.courses);

  function resetFromGoal(source: CohortGoal | null) {
    if (source) {
      title = source.title;
      description = source.description ?? '';
      type = source.type;
      courseIds = source.courseIds ?? [];
      requiredCount = source.requiredCount ?? null;
      scoreThreshold = source.scoreThreshold ?? 80;
      teamPassRateThreshold = source.teamPassRateThreshold ?? 80;
      deadlineKind = source.deadlineKind;
      deadlineDate = source.deadlineDate ? new Date(source.deadlineDate).toISOString().slice(0, 10) : '';
      relativeDays = source.relativeDays ?? null;
      recurringMonths = source.recurringMonths ?? null;
      reminderDaysBeforeText = (source.reminderDaysBefore ?? [7, 1]).join(', ');
      formError = null;
      return;
    }

    title = '';
    description = '';
    type = 'complete_all';
    courseIds = [];
    requiredCount = null;
    scoreThreshold = 80;
    teamPassRateThreshold = 80;
    deadlineKind = 'none';
    deadlineDate = '';
    relativeDays = null;
    recurringMonths = null;
    reminderDaysBeforeText = '7, 1';
    formError = null;
  }

  // Re-seed form fields only on the open→true transition or when the goal
  // *reference* changes. `untrack` prevents per-property mutations on the goal
  // proxy (e.g. an in-place store refresh after save) from clobbering edits.
  $effect(() => {
    if (!open) return;
    const currentGoal = goal;
    untrack(() => resetFromGoal(currentGoal));
  });

  // Readiness goals must use deadline=none.
  $effect(() => {
    if (type === 'readiness' && deadlineKind !== 'none') {
      deadlineKind = 'none';
    }
  });

  function parseReminders(text: string): number[] {
    return text
      .split(/[,\s]+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => Number(part))
      .filter((value) => Number.isFinite(value) && value >= 0 && value <= 365);
  }

  function buildPayload(): TCreateCohortGoal | null {
    if (!title.trim()) {
      formError = $t('cohorts.goals.modal.title_label') + ' is required';
      return null;
    }

    if (courseIds.length === 0) {
      formError = $t('cohorts.goals.modal.courses_label') + ' is required';
      return null;
    }

    return {
      title: title.trim(),
      description: description.trim() || null,
      type,
      courseIds,
      requiredCount: type === 'n_of_m' ? requiredCount : null,
      scoreThreshold: type === 'score' || type === 'pass_rate' ? scoreThreshold : null,
      teamPassRateThreshold: type === 'pass_rate' ? teamPassRateThreshold : null,
      reminderDaysBefore: parseReminders(reminderDaysBeforeText),
      deadlineKind,
      deadlineDate: deadlineKind === 'absolute' && deadlineDate ? new Date(deadlineDate).toISOString() : null,
      relativeDays: deadlineKind === 'relative_to_join' ? relativeDays : null,
      recurringMonths: deadlineKind === 'recurring' ? recurringMonths : null
    };
  }

  async function handleSave() {
    formError = null;
    const payload = buildPayload();
    if (!payload) return;

    isSaving = true;
    try {
      const ok =
        isEditing && goal
          ? await cohortGoalApi.updateGoal(cohortId, goal.id, payload as TUpdateCohortGoal)
          : await cohortGoalApi.createGoal(cohortId, payload);
      if (ok) onClose();
      else formError = cohortGoalApi.error ?? 'Failed to save';
    } finally {
      isSaving = false;
    }
  }

  function toggleCourse(courseId: string) {
    courseIds = courseIds.includes(courseId) ? courseIds.filter((id) => id !== courseId) : [...courseIds, courseId];
  }
</script>

<Dialog.Root bind:open onOpenChange={(value) => !value && onClose()}>
  <Dialog.Content class="max-h-[90vh] w-[96vw] max-w-2xl overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>
        {isEditing ? $t('cohorts.goals.modal.edit_title') : $t('cohorts.goals.modal.create_title')}
      </Dialog.Title>
    </Dialog.Header>

    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <Label for="goal-title">{$t('cohorts.goals.modal.title_label')} *</Label>
        <Input
          id="goal-title"
          bind:value={title}
          maxlength={255}
          placeholder={$t('cohorts.goals.modal.title_placeholder')}
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <Label for="goal-description">{$t('cohorts.goals.modal.description_label')}</Label>
        <Textarea
          id="goal-description"
          bind:value={description}
          rows={2}
          maxlength={2000}
          placeholder={$t('cohorts.goals.modal.description_placeholder')}
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <Label>{$t('cohorts.goals.modal.type_label')}</Label>
        <Select.Root type="single" bind:value={type}>
          <Select.Trigger>{$t(`cohorts.goals.type.${type}`)}</Select.Trigger>
          <Select.Content style="z-index: 500 !important">
            {#each COHORT_GOAL_TYPES as goalType (goalType)}
              <Select.Item value={goalType}>
                {$t(`cohorts.goals.type.${goalType}`)}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="flex flex-col gap-1.5">
        <Label>{$t('cohorts.goals.modal.courses_label')} *</Label>
        {#if availableCourses.length === 0}
          <p class="ui:text-muted-foreground text-sm">No courses in this cohort yet.</p>
        {:else}
          <div class="flex flex-col gap-2 rounded-md border p-3">
            {#each availableCourses as item (item.courseId)}
              <label class="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={courseIds.includes(item.courseId)}
                  onCheckedChange={() => toggleCourse(item.courseId)}
                />
                <span>{item.course.title ?? 'Untitled course'}</span>
              </label>
            {/each}
          </div>
        {/if}
      </div>

      {#if type === 'n_of_m'}
        <div class="flex flex-col gap-1.5">
          <Label for="goal-required-count">{$t('cohorts.goals.modal.required_count_label')} *</Label>
          <Input
            id="goal-required-count"
            type="number"
            min="1"
            max={courseIds.length || 50}
            value={requiredCount ?? ''}
            oninput={(event) => {
              const value = (event.currentTarget as HTMLInputElement).valueAsNumber;
              requiredCount = Number.isNaN(value) ? null : value;
            }}
          />
        </div>
      {/if}

      {#if type === 'score' || type === 'pass_rate'}
        <div class="flex flex-col gap-1.5">
          <Label for="goal-score">{$t('cohorts.goals.modal.score_threshold_label')} *</Label>
          <Input
            id="goal-score"
            type="number"
            min="0"
            max="100"
            value={scoreThreshold ?? ''}
            oninput={(event) => {
              const value = (event.currentTarget as HTMLInputElement).valueAsNumber;
              scoreThreshold = Number.isNaN(value) ? null : value;
            }}
          />
        </div>
      {/if}

      {#if type === 'pass_rate'}
        <div class="flex flex-col gap-1.5">
          <Label for="goal-team-rate">{$t('cohorts.goals.modal.team_pass_rate_label')} *</Label>
          <Input
            id="goal-team-rate"
            type="number"
            min="0"
            max="100"
            value={teamPassRateThreshold ?? ''}
            oninput={(event) => {
              const value = (event.currentTarget as HTMLInputElement).valueAsNumber;
              teamPassRateThreshold = Number.isNaN(value) ? null : value;
            }}
          />
        </div>
      {/if}

      <div class="flex flex-col gap-1.5">
        <Label>{$t('cohorts.goals.modal.deadline_label')}</Label>
        <Select.Root type="single" bind:value={deadlineKind} disabled={type === 'readiness'}>
          <Select.Trigger>{$t(`cohorts.goals.deadline_kind.${deadlineKind}`)}</Select.Trigger>
          <Select.Content style="z-index: 500 !important">
            {#each COHORT_GOAL_DEADLINE_KINDS as kind (kind)}
              <Select.Item value={kind}>
                {$t(`cohorts.goals.deadline_kind.${kind}`)}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      {#if deadlineKind === 'absolute'}
        <div class="flex flex-col gap-1.5">
          <Label for="goal-deadline-date">{$t('cohorts.goals.modal.deadline_date_label')} *</Label>
          <Input id="goal-deadline-date" type="date" bind:value={deadlineDate} />
        </div>
      {/if}

      {#if deadlineKind === 'relative_to_join'}
        <div class="flex flex-col gap-1.5">
          <Label for="goal-relative-days">{$t('cohorts.goals.modal.relative_days_label')} *</Label>
          <Input
            id="goal-relative-days"
            type="number"
            min="1"
            max="3650"
            value={relativeDays ?? ''}
            oninput={(event) => {
              const value = (event.currentTarget as HTMLInputElement).valueAsNumber;
              relativeDays = Number.isNaN(value) ? null : value;
            }}
          />
        </div>
      {/if}

      {#if deadlineKind === 'recurring'}
        <div class="flex flex-col gap-1.5">
          <Label for="goal-recurring-months">{$t('cohorts.goals.modal.recurring_months_label')} *</Label>
          <Input
            id="goal-recurring-months"
            type="number"
            min="1"
            max="120"
            value={recurringMonths ?? ''}
            oninput={(event) => {
              const value = (event.currentTarget as HTMLInputElement).valueAsNumber;
              recurringMonths = Number.isNaN(value) ? null : value;
            }}
          />
        </div>
      {/if}

      {#if deadlineKind !== 'none'}
        <div class="flex flex-col gap-1.5">
          <Label for="goal-reminders">{$t('cohorts.goals.modal.reminders_label')}</Label>
          <Input id="goal-reminders" bind:value={reminderDaysBeforeText} placeholder="7, 3, 1" />
          <p class="ui:text-muted-foreground text-xs">{$t('cohorts.goals.modal.reminders_helper')}</p>
        </div>
      {/if}

      {#if formError}
        <p class="text-sm text-red-600">{formError}</p>
      {/if}

      <div class="mt-2 flex justify-end gap-2">
        <Button variant="ghost" onclick={onClose} disabled={isSaving}>
          {$t('cohorts.goals.modal.cancel')}
        </Button>
        <Button variant="secondary" onclick={handleSave} loading={isSaving} disabled={isSaving}>
          {$t('cohorts.goals.modal.save')}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
