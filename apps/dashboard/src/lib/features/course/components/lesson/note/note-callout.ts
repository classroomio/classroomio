import type { Component } from 'svelte';
import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
import InfoIcon from '@lucide/svelte/icons/info';
import LightbulbIcon from '@lucide/svelte/icons/lightbulb';
import StarIcon from '@lucide/svelte/icons/star';
import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

export const NOTE_CALLOUT_BUTTON_KEY = 'course.navItem.lessons.materials.tabs.note.callout.button';

export const NOTE_CALLOUT_STYLES = ['info', 'tip', 'important', 'warning', 'highlight'] as const;

export type NoteCalloutStyleId = (typeof NOTE_CALLOUT_STYLES)[number];

export type NoteCalloutStyle = '' | NoteCalloutStyleId;

interface NoteCalloutOption {
  id: NoteCalloutStyle;
  labelKey: string;
  dotClass: string;
  labelClass: string;
  icon?: Component;
}

export const NOTE_CALLOUT_OPTIONS: NoteCalloutOption[] = [
  {
    id: '',
    labelKey: 'course.navItem.lessons.materials.tabs.note.callout.default',
    dotClass: 'ui:bg-muted-foreground',
    labelClass: ''
  },
  {
    id: 'info',
    labelKey: 'course.navItem.lessons.materials.tabs.note.callout.info',
    dotClass: 'bg-[oklch(0.5_0.17_250)]',
    labelClass: 'text-[oklch(0.5_0.17_250)] dark:text-[oklch(0.82_0.1_250)]',
    icon: InfoIcon
  },
  {
    id: 'tip',
    labelKey: 'course.navItem.lessons.materials.tabs.note.callout.tip',
    dotClass: 'bg-[oklch(0.45_0.14_160)]',
    labelClass: 'text-[oklch(0.45_0.14_160)] dark:text-[oklch(0.82_0.1_160)]',
    icon: LightbulbIcon
  },
  {
    id: 'important',
    labelKey: 'course.navItem.lessons.materials.tabs.note.callout.important',
    dotClass: 'ui:bg-primary',
    labelClass: 'ui:text-primary',
    icon: CircleAlertIcon
  },
  {
    id: 'warning',
    labelKey: 'course.navItem.lessons.materials.tabs.note.callout.warning',
    dotClass: 'bg-[oklch(0.5_0.15_70)]',
    labelClass: 'text-[oklch(0.5_0.15_70)] dark:text-[oklch(0.84_0.12_70)]',
    icon: TriangleAlertIcon
  },
  {
    id: 'highlight',
    labelKey: 'course.navItem.lessons.materials.tabs.note.callout.highlight',
    dotClass: 'bg-[oklch(0.45_0.13_95)]',
    labelClass: 'text-[oklch(0.45_0.13_95)] dark:text-[oklch(0.86_0.12_95)]',
    icon: StarIcon
  }
];

export function noteCalloutMeta(style: NoteCalloutStyle) {
  if (!style) return null;

  const match = NOTE_CALLOUT_OPTIONS.find((option) => option.id === style);
  if (!match?.icon) return null;

  return {
    labelKey: match.labelKey,
    labelClass: match.labelClass,
    icon: match.icon
  };
}

export function noteCalloutFrameClass(style: NoteCalloutStyle) {
  if (!style) return '';

  return `note-callout note-callout-${style} m-2 overflow-hidden rounded-lg border`;
}
