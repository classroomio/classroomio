<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import * as Select from '@cio/ui/base/select';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { NumberField } from '@cio/ui/custom/number-field';
  import { LIVE_SESSION_REMINDER_MAX_COUNT } from '@cio/utils/constants/live-session-reminder';

  import { t } from '$lib/utils/functions/translations';
  import {
    LIVE_SESSION_REMINDER_PRESETS_MINUTES,
    LIVE_SESSION_REMINDER_UNITS,
    createReminderRow,
    getReminderRowErrors,
    reminderRowToMinutes,
    splitReminderOffset
  } from '$features/course/utils/live-session-reminder-utils';
  import type { LiveSessionReminderRow, LiveSessionReminderUnit } from '$features/course/utils/types';

  interface Props {
    rows: LiveSessionReminderRow[];
    onchange: () => void;
  }

  let { rows = $bindable(), onchange }: Props = $props();

  const T = 'course.navItem.settings.live_session_reminders';

  const rowErrors = $derived(getReminderRowErrors(rows));
  const configuredOffsets = $derived(new Set(rows.map(reminderRowToMinutes)));
  const canAddRow = $derived(rows.length < LIVE_SESSION_REMINDER_MAX_COUNT);

  function formatDuration(offsetMinutes: number) {
    const { amount, unit } = splitReminderOffset(offsetMinutes);

    return $t(`${T}.duration.${unit}`, { count: amount });
  }

  function setRows(nextRows: LiveSessionReminderRow[]) {
    rows = nextRows;
    onchange();
  }

  function updateRow(rowId: string, changes: Partial<Omit<LiveSessionReminderRow, 'id'>>) {
    setRows(rows.map((row) => (row.id === rowId ? { ...row, ...changes } : row)));
  }

  function addRow() {
    if (!canAddRow) return;

    setRows([...rows, createReminderRow(60)]);
  }

  function addPreset(offsetMinutes: number) {
    if (!canAddRow || configuredOffsets.has(offsetMinutes)) return;

    setRows([...rows, createReminderRow(offsetMinutes)]);
  }

  function removeRow(rowId: string) {
    setRows(rows.filter((row) => row.id !== rowId));
  }
</script>

<Field.Group class="gap-4">
  {#if rows.length === 0}
    <p class="ui:text-muted-foreground text-sm" data-testid="live-session-reminders-empty">
      {$t(`${T}.empty`)}
    </p>
  {/if}

  {#each rows as row (row.id)}
    {@const error = rowErrors[row.id]}
    <Field.Field data-invalid={error ? true : undefined}>
      <div class="flex flex-wrap items-start gap-2">
        <NumberField
          className="w-24"
          value={row.amount}
          min={1}
          integer
          label=""
          placeholder="1"
          onValueChange={(value) => updateRow(row.id, { amount: value ?? 0 })}
        />
        <Select.Root
          type="single"
          value={row.unit}
          onValueChange={(value) => updateRow(row.id, { unit: value as LiveSessionReminderUnit })}
        >
          <Select.Trigger class="w-32" aria-label={$t(`${T}.unit_label`)}>
            {$t(`${T}.units.${row.unit}`)}
          </Select.Trigger>
          <Select.Content>
            {#each LIVE_SESSION_REMINDER_UNITS as unit (unit)}
              <Select.Item value={unit} label={$t(`${T}.units.${unit}`)}>{$t(`${T}.units.${unit}`)}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        <span class="ui:text-muted-foreground flex h-9 flex-1 items-center text-sm">
          {#if !error}
            {$t(`${T}.preview`, { duration: formatDuration(reminderRowToMinutes(row)) })}
          {/if}
        </span>
        <IconButton
          variant="secondary"
          size="icon"
          tooltip={$t(`${T}.remove`)}
          aria-label={$t(`${T}.remove`)}
          onclick={() => removeRow(row.id)}
        >
          <XIcon />
        </IconButton>
      </div>
      {#if error}
        <Field.Error>{$t(`${T}.validation.${error}`)}</Field.Error>
      {/if}
    </Field.Field>
  {/each}

  <div class="flex flex-wrap items-center gap-2">
    <Button variant="outline" size="sm" disabled={!canAddRow} onclick={addRow} testId="live-session-reminders-add">
      <PlusIcon />
      {$t(`${T}.add`)}
    </Button>
    <span class="ui:text-muted-foreground text-sm">{$t(`${T}.presets_label`)}</span>
    {#each LIVE_SESSION_REMINDER_PRESETS_MINUTES as offsetMinutes (offsetMinutes)}
      <Button
        variant="secondary"
        size="sm"
        class="h-7 rounded-full px-3 text-xs"
        disabled={!canAddRow || configuredOffsets.has(offsetMinutes)}
        onclick={() => addPreset(offsetMinutes)}
      >
        {formatDuration(offsetMinutes)}
      </Button>
    {/each}
  </div>

  {#if !canAddRow}
    <Field.Description>{$t(`${T}.max_count`, { count: LIVE_SESSION_REMINDER_MAX_COUNT })}</Field.Description>
  {/if}
</Field.Group>
