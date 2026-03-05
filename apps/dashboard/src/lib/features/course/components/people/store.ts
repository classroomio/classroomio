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

export const DEFAULT_INVITE_SETTINGS_STATE: InviteSettingsState = {
  preset: 'MULTI_USE_30D',
  customExpiresAt: '',
  customMaxUses: 1
};

export const inviteSettingsStore = writable<InviteSettingsState>({ ...DEFAULT_INVITE_SETTINGS_STATE });

export interface StudentInviteLinkState {
  link: string;
  qrImage: string;
  isCreating: boolean;
  isLoadingQRDownload: boolean;
}

export const DEFAULT_STUDENT_INVITE_LINK_STATE: StudentInviteLinkState = {
  link: '',
  qrImage: '',
  isCreating: false,
  isLoadingQRDownload: false
};

export const studentInviteLinkStore = writable<StudentInviteLinkState>({ ...DEFAULT_STUDENT_INVITE_LINK_STATE });
