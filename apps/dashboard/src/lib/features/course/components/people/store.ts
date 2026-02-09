import { writable } from 'svelte/store';
import type { InvitePreset } from './types';

export const deleteMemberModal = writable({
  open: false
});

export const qrInviteNodeStore = writable<HTMLElement | null>(null);

export interface InviteSettingsState {
  preset: InvitePreset;
  customExpiresAt: string;
  customMaxUses: number;
}

export const inviteSettingsStore = writable<InviteSettingsState>({
  preset: 'MULTI_USE_30D',
  customExpiresAt: '',
  customMaxUses: 1
});

export interface StudentInviteLinkState {
  link: string;
  qrImage: string;
  isCreating: boolean;
  isLoadingQRDownload: boolean;
}

export const studentInviteLinkStore = writable<StudentInviteLinkState>({
  link: '',
  qrImage: '',
  isCreating: false,
  isLoadingQRDownload: false
});
