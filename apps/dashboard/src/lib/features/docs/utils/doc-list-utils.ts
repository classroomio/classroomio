import { t } from '$lib/utils/functions/translations';
import type { DocListItem } from '../api/docs.svelte';

export interface NoteListSection {
  id: string;
  label: string;
  notes: DocListItem[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseNoteDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatPinnedNoteDate(updatedAt: string) {
  const date = parseNoteDate(updatedAt);

  if (!date) {
    return '';
  }

  const datePart = new Intl.DateTimeFormat(undefined, {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  }).format(date);
  const dayPart = new Intl.DateTimeFormat(undefined, {
    weekday: 'long'
  })
    .format(date)
    .toUpperCase();

  return `${datePart} ${dayPart}`;
}

export function formatRecentNoteDay(updatedAt: string) {
  const date = parseNoteDate(updatedAt);

  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long'
  }).format(date);
}

export function notePreviewText(note: DocListItem) {
  const preview = note.plainText?.trim();

  if (!preview) {
    return t.get('docs.list.no_content');
  }

  return preview;
}

export function formatRecentNoteMeta(updatedAt: string, note: DocListItem) {
  const day = formatRecentNoteDay(updatedAt);
  const preview = notePreviewText(note);

  return day ? `${day} ${preview}` : preview;
}

export function displayNoteTitle(title: string) {
  const trimmedTitle = title.trim();
  const defaultTitle = t.get('docs.org.new_note_title');

  return trimmedTitle === defaultTitle || !trimmedTitle ? defaultTitle : trimmedTitle;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sectionLabelForDate(date: Date, now: Date) {
  const todayStart = startOfLocalDay(now).getTime();
  const dateStart = startOfLocalDay(date).getTime();
  const diffDays = Math.floor((todayStart - dateStart) / DAY_MS);

  if (diffDays <= 7) {
    return t.get('docs.workspace.sections.previous_7_days');
  }

  if (diffDays <= 30) {
    return t.get('docs.workspace.sections.previous_30_days');
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function buildNoteListSections(notes: DocListItem[]): NoteListSection[] {
  const pinnedNotes = notes
    .filter((note) => note.isPinned)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());

  const unpinnedNotes = notes
    .filter((note) => !note.isPinned)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());

  const sections: NoteListSection[] = [];

  if (pinnedNotes.length > 0) {
    sections.push({
      id: 'pinned',
      label: t.get('docs.workspace.sections.pinned'),
      notes: pinnedNotes
    });
  }

  const grouped = new Map<string, DocListItem[]>();
  const now = new Date();

  for (const note of unpinnedNotes) {
    const date = parseNoteDate(note.updatedAt);

    if (!date) {
      continue;
    }

    const label = sectionLabelForDate(date, now);
    const bucket = grouped.get(label) ?? [];
    bucket.push(note);
    grouped.set(label, bucket);
  }

  for (const [label, sectionNotes] of grouped) {
    sections.push({
      id: label,
      label,
      notes: sectionNotes
    });
  }

  return sections;
}
