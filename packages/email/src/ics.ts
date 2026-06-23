/**
 * Minimal hand-rolled iCalendar (.ics) builder for live-session invites.
 * No dependency — emits a single VEVENT (times in UTC; calendars localize for
 * the viewer) with optional DISPLAY alarms. A stable `uid` + incrementing
 * `sequence` lets a later send (METHOD:REQUEST) update the same calendar event
 * instead of creating a duplicate.
 */

export interface SessionIcsInput {
  uid: string;
  /** Increment on each update so calendars supersede the prior version. */
  sequence?: number;
  method?: 'PUBLISH' | 'REQUEST' | 'CANCEL';
  /** Event start as an ISO string / absolute instant. */
  start: string;
  durationMinutes?: number;
  title: string;
  description?: string;
  url?: string;
  /** Minutes before start for DISPLAY alarms (e.g. [1440, 60]). */
  alarmsBeforeMinutes?: number[];
}

function toIcsUtc(date: Date): string {
  // 2026-06-20T18:00:00.000Z -> 20260620T180000Z
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function triggerFromMinutes(minutes: number): string {
  if (minutes % 1440 === 0) return `-P${minutes / 1440}D`;
  if (minutes % 60 === 0) return `-PT${minutes / 60}H`;
  return `-PT${minutes}M`;
}

export function buildSessionIcs(input: SessionIcsInput): string {
  const {
    uid,
    sequence = 0,
    method = 'PUBLISH',
    start,
    durationMinutes = 60,
    title,
    description,
    url,
    alarmsBeforeMinutes = []
  } = input;

  const startDate = new Date(start);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  const stamp = toIcsUtc(startDate);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ClassroomIO//Live Session//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `SEQUENCE:${sequence}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toIcsUtc(startDate)}`,
    `DTEND:${toIcsUtc(endDate)}`,
    `SUMMARY:${escapeText(title)}`
  ];

  if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
  if (url) lines.push(`URL:${escapeText(url)}`);
  if (method === 'CANCEL') lines.push('STATUS:CANCELLED');

  for (const minutes of alarmsBeforeMinutes) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(title)}`,
      `TRIGGER:${triggerFromMinutes(minutes)}`,
      'END:VALARM'
    );
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}
