import {
  LIVE_SESSION_REMINDER_MAX_OFFSET_MINUTES,
  LIVE_SESSION_REMINDER_MIN_OFFSET_MINUTES
} from '@cio/utils/constants/live-session-reminder';

import type { LiveSessionReminderRow, LiveSessionReminderRowError, LiveSessionReminderUnit } from './types';

export const LIVE_SESSION_REMINDER_UNIT_MINUTES: Record<LiveSessionReminderUnit, number> = {
  days: 1440,
  hours: 60,
  minutes: 1
};

export const LIVE_SESSION_REMINDER_UNITS: LiveSessionReminderUnit[] = ['days', 'hours', 'minutes'];

export const LIVE_SESSION_REMINDER_PRESETS_MINUTES = [1440, 360, 60, 30];

/**
 * Splits an offset into the largest unit that divides it evenly, e.g. 360 → 6 hours.
 */
export function splitReminderOffset(offsetMinutes: number): { amount: number; unit: LiveSessionReminderUnit } {
  const unit =
    LIVE_SESSION_REMINDER_UNITS.find(
      (candidate) => offsetMinutes % LIVE_SESSION_REMINDER_UNIT_MINUTES[candidate] === 0
    ) ?? 'minutes';

  return { amount: offsetMinutes / LIVE_SESSION_REMINDER_UNIT_MINUTES[unit], unit };
}

export function createReminderRow(offsetMinutes: number): LiveSessionReminderRow {
  return { id: crypto.randomUUID(), ...splitReminderOffset(offsetMinutes) };
}

export function reminderRowToMinutes(row: Pick<LiveSessionReminderRow, 'amount' | 'unit'>): number {
  return row.amount * LIVE_SESSION_REMINDER_UNIT_MINUTES[row.unit];
}

/**
 * The first validation problem for each invalid row, keyed by row id. Later duplicates of an offset are flagged,
 * not the first one.
 */
export function getReminderRowErrors(rows: LiveSessionReminderRow[]): Record<string, LiveSessionReminderRowError> {
  const errors: Record<string, LiveSessionReminderRowError> = {};
  const seenOffsets = new Set<number>();

  for (const row of rows) {
    const offsetMinutes = reminderRowToMinutes(row);

    if (!Number.isInteger(row.amount) || row.amount < 1) {
      errors[row.id] = 'amount';
    } else if (offsetMinutes < LIVE_SESSION_REMINDER_MIN_OFFSET_MINUTES) {
      errors[row.id] = 'min';
    } else if (offsetMinutes > LIVE_SESSION_REMINDER_MAX_OFFSET_MINUTES) {
      errors[row.id] = 'max';
    } else if (seenOffsets.has(offsetMinutes)) {
      errors[row.id] = 'duplicate';
    }

    seenOffsets.add(offsetMinutes);
  }

  return errors;
}

/**
 * Offsets in minutes, earliest reminder first.
 */
export function reminderRowsToOffsets(rows: LiveSessionReminderRow[]): number[] {
  return rows.map(reminderRowToMinutes).sort((first, second) => second - first);
}
