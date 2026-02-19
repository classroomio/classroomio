import type { InvitePreset, InviteStatus } from './types';

const INVITE_PRESET_LABEL_KEYS: Record<InvitePreset, string> = {
  ONE_TIME_24H: 'course.navItem.people.invite_modal.presets.one_time_24h',
  MULTI_USE_7D: 'course.navItem.people.invite_modal.presets.multi_use_7d',
  MULTI_USE_30D: 'course.navItem.people.invite_modal.presets.multi_use_30d',
  CUSTOM: 'course.navItem.people.invite_modal.presets.custom'
};

export function formatDate(date: string | null | undefined): string {
  if (!date) return 'n/a';
  return new Date(date).toLocaleString();
}

export function shortId(id: string): string {
  return `${id.slice(0, 8)}...`;
}

export function getStatusClass(status: InviteStatus): string {
  if (status === 'ACTIVE') return 'bg-green-100 text-green-700';
  if (status === 'REVOKED') return 'bg-red-100 text-red-700';
  if (status === 'EXPIRED') return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-700';
}

export function getPresetLabelKey(preset: InvitePreset): string {
  return INVITE_PRESET_LABEL_KEYS[preset];
}

export interface InvitePayloadInput {
  preset: InvitePreset;
  customExpiresAt: string;
  customMaxUses: number;
}

export function getInvitePayload(input: InvitePayloadInput): {
  preset: InvitePreset;
  expiresAt?: string;
  maxUses?: number;
} {
  const { preset, customExpiresAt, customMaxUses } = input;
  const payload: { preset: InvitePreset; expiresAt?: string; maxUses?: number } = {
    preset
  };

  if (preset === 'CUSTOM') {
    if (!customExpiresAt) {
      throw new Error('Custom expiry date is required');
    }
    payload.expiresAt = new Date(customExpiresAt).toISOString();
    payload.maxUses = customMaxUses;
  }

  return payload;
}

export const INVITE_PRESET_OPTIONS: Array<{ value: InvitePreset; labelKey: string }> = [
  { value: 'ONE_TIME_24H', labelKey: 'course.navItem.people.invite_modal.presets.one_time_24h' },
  { value: 'MULTI_USE_7D', labelKey: 'course.navItem.people.invite_modal.presets.multi_use_7d' },
  { value: 'MULTI_USE_30D', labelKey: 'course.navItem.people.invite_modal.presets.multi_use_30d' },
  { value: 'CUSTOM', labelKey: 'course.navItem.people.invite_modal.presets.custom' }
];
